const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const leaderboardRouter = require('./routes/leaderboard');
const { initGameSocket } = require('./socket/game.socket');

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

async function main() {
  const app = express();
  app.use(cors({ origin: CLIENT_ORIGIN }));
  app.use(express.json());

  app.use('/leaderboard', leaderboardRouter);

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: CLIENT_ORIGIN,
      methods: ['GET', 'POST'],
    },
  });

  initGameSocket(io);

  server.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error('Fatal error starting server', err);
  process.exit(1);
});


