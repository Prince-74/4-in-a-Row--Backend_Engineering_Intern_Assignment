const express = require('express');
const { getLeaderboard } = require('../db/prisma');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const players = await getLeaderboard(limit);
    res.json(players);
  } catch (err) {
    console.error('Error fetching leaderboard', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;


