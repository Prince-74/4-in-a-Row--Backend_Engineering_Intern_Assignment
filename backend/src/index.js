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

  // basic health endpoint used by keep-alive pings
  app.get('/health', (req, res) => res.json({ status: 'ok' }));

 
  app.use('/leaderboard', leaderboardRouter);

  
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: CLIENT_ORIGIN,
      methods: ['GET', 'POST'],
    },
  });

  
  const { connectProducer } = require('./kafka/producer');
  // connect Kafka producer (if configured)
  try {
    await connectProducer();
  } catch (err) {
    console.warn('Kafka producer not connected, continuing without Kafka');
  }

  initGameSocket(io);

  
  server.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
  });
  // keep-alive pinger removed; use an external uptime monitor to ping /health
}

main().catch((err) => {
  console.error('Fatal error starting server', err);
  process.exit(1);
});


