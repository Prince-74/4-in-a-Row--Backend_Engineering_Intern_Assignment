const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

dotenv.config();

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
    
    if (err.code === 'P2021') {
      console.warn(
        'Prisma tables not found yet (have you run `npm run prisma:migrate`?). Returning empty leaderboard.',
      );
      return [];
    }
    throw err;
  }
}

module.exports = {
  prisma,
  ensurePlayer,
  saveCompletedGame,
  getLeaderboard,
};


