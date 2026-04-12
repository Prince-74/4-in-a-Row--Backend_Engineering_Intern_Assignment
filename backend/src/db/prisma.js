const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL not set; Prisma will not be able to connect to the database.');
}

const prisma = new PrismaClient();

async function ensurePlayer(username) {
  const player = await prisma.player.upsert({
    where: { username },
    update: {},
    create: { username },
  });
  return player;
}

async function saveCompletedGame({ gameId, player1, player2, winner, createdAt, durationMs }) {
  const [p1, p2] = await Promise.all([
    ensurePlayer(player1),
    ensurePlayer(player2),
  ]);

  if (winner) {
    await prisma.player.update({
      where: { username: winner },
      data: { gamesWon: { increment: 1 } },
    });
  }

  await prisma.game.create({
    data: {
      id: gameId,
      player1Id: p1.id,
      player2Id: p2.id,
      winnerId: winner ? (winner === player1 ? p1.id : p2.id) : null,
      durationMs,
      createdAt,
    },
  });
}


async function getLeaderboard(limit = 10) {
  try {
    const players = await prisma.player.findMany({
      where: {
        username: {
          not: 'BOT',
        },
      },
      orderBy: { gamesWon: 'desc' },
      take: limit,
    });
    return players;
  } catch (err) {
    // Common initialization / connection failures (e.g., cloud provider: "Tenant or user not found")
    // Handle gracefully for leaderboard requests so frontend doesn't receive a 500 when DB is misconfigured.
    const name = err && err.name;
    const msg = err && (err.message || '');

    if (err?.code === 'P2021' || name === 'PrismaClientInitializationError' || msg.includes('Tenant or user not found')) {
      console.warn('Prisma not ready or invalid credentials. Returning empty leaderboard.', msg || err);
      return [];
    }

    // rethrow unexpected errors so they can be handled upstream/logged
    throw err;
  }
}

module.exports = {
  prisma,
  ensurePlayer,
  saveCompletedGame,
  getLeaderboard,
};


