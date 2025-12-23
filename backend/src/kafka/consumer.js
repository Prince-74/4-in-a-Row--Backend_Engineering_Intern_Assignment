const { Kafka, logLevel } = require('kafkajs');
const { PrismaClient } = require('@prisma/client');

const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const clientId = process.env.KAFKA_CLIENT_ID || 'connect4-analytics';
const groupId = process.env.KAFKA_GROUP_ID || 'connect4-analytics-group';
const analyticsTopic = process.env.KAFKA_ANALYTICS_TOPIC || 'game-analytics';

const kafka = new Kafka({ clientId, brokers, logLevel: logLevel.INFO });
const consumer = kafka.consumer({ groupId, allowAutoTopicCreation: true });

// In-memory metrics
const metrics = {
  totalGames: 0,
  totalDurationMs: 0,
  winnerCounts: {},
  gamesPerDay: {},
  gamesPerHour: {},
  userStats: {},
};

// NOTE: Analytics consumer does NOT persist to DB.
// The backend already saves completed games via saveCompletedGame().
// This consumer tracks in-memory metrics and logs events only.

function updateGameEndMetrics(p) {
  metrics.totalGames += 1;
  if (typeof p.durationMs === 'number') metrics.totalDurationMs += p.durationMs;

  const winner = p.winner || 'none';
  metrics.winnerCounts[winner] = (metrics.winnerCounts[winner] || 0) + 1;

  const created = p.createdAt ? new Date(p.createdAt) : new Date();
  const day = created.toISOString().slice(0, 10);
  const hour = created.toISOString().slice(0, 13);
  metrics.gamesPerDay[day] = (metrics.gamesPerDay[day] || 0) + 1;
  metrics.gamesPerHour[hour] = (metrics.gamesPerHour[hour] || 0) + 1;

  [p.player1, p.player2].forEach((u) => {
    if (!u) return;
    metrics.userStats[u] = metrics.userStats[u] || { gamesPlayed: 0, wins: 0 };
    metrics.userStats[u].gamesPlayed += 1;
  });
  if (p.winner) {
    metrics.userStats[p.winner] = metrics.userStats[p.winner] || { gamesPlayed: 0, wins: 0 };
    metrics.userStats[p.winner].wins += 1;
  }
}


// enable persistence when ANALYTICS_PERSIST_METRICS true OR DATABASE_URL is provided
const persistMetricsEnabled = (process.env.ANALYTICS_PERSIST_METRICS === '1' || process.env.ANALYTICS_PERSIST_METRICS === 'true' || !!process.env.DATABASE_URL);
let prisma = null;
async function initPrismaIfNeeded() {
  if (!persistMetricsEnabled) return;
  if (prisma) return;
  try {
    prisma = new PrismaClient();
    await prisma.$connect();
    console.log('Prisma connected for analytics metrics persistence');
  } catch (err) {
    console.warn('Prisma connect failed for analytics, disabling persistence:', err.message || err);
    prisma = null;
  }
}

async function persistMetricsSnapshot() {
  if (!prisma) return;
  try {
    const avgMs = metrics.totalGames > 0 ? Math.round(metrics.totalDurationMs / metrics.totalGames) : 0;
    await prisma.metrics.create({
      data: {
        totalGames: metrics.totalGames,
        avgDurationMs: avgMs,
        winnerCounts: metrics.winnerCounts,
        gamesPerDay: metrics.gamesPerDay,
        gamesPerHour: metrics.gamesPerHour,
        userStats: metrics.userStats,
      },
    });
  } catch (err) {
    console.warn('Failed to persist metrics snapshot', err.message || err);
  }
}

async function run() {
  await initPrismaIfNeeded();
  await consumer.connect();
  console.log('Analytics consumer connected to Kafka');
  await consumer.subscribe({ topic: analyticsTopic, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const value = message.value.toString();
        const event = JSON.parse(value);
        console.log('[analytics] received', event.type || 'unknown', event.gameId || '');

        const t = event.type;
        if (t === 'GAME_COMPLETED' || t === 'GAME_FORFEITED') {
          const p = event.payload || {};
          updateGameEndMetrics(p);
          // persist snapshot to DB if enabled
          if (prisma) await persistMetricsSnapshot();
        }

        if (metrics.totalGames > 0 && metrics.totalGames % 10 === 0) {
          const avgMs = metrics.totalDurationMs / metrics.totalGames;
          console.log(`[analytics] snapshot total=${metrics.totalGames} avgMs=${Math.round(avgMs)}`);
        }
      } catch (err) {
        console.error('[analytics] Error processing message', err);
      }
    },
  });
}

if (require.main === module) {
  run().catch((err) => {
    console.error('Analytics consumer failed', err);
    process.exit(1);
  });

  setInterval(() => {
    if (metrics.totalGames === 0) return;
    const avgMs = metrics.totalDurationMs / metrics.totalGames;
    console.log('=== Analytics Snapshot ===');
    console.log('Total games:', metrics.totalGames);
    console.log('Average duration (s):', Math.round(avgMs / 1000));
    console.log('Top winners:', Object.entries(metrics.winnerCounts).sort((a, b) => b[1] - a[1]).slice(0, 5));
    const today = new Date().toISOString().slice(0, 10);
    console.log('Games today:', metrics.gamesPerDay[today] || 0);
  }, 30_000);
}

module.exports = { run, metrics };
