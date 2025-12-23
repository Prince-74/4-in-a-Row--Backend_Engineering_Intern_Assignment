🎯 4 in a Row (Connect Four) — Backend Engineering Intern Assignment
A real-time multiplayer Connect Four (4 in a Row) game backend & reference frontend.
Supports 1v1 matchmaking (with competitive bot fallback), real-time gameplay (Socket.IO), persistent leaderboard (Postgres + Prisma) and decoupled analytics via Kafka.

Live demo

Frontend: https://YOUR_FRONTEND_URL
Backend: https://YOUR_BACKEND_URL
⚠️ Render cold start: backend on free Render may sleep. If the app doesn't respond immediately, wait ~20–30s and refresh.

Table of contents
Core goals
Features
Tech stack
Project structure
Gameplay rules
Matchmaking & bot
Realtime & socket events
APIs
Environment variables
Run locally
Kafka (analytics) local setup
Deployment notes
Troubleshooting
Contributing
License
Core goals
Build a low-latency multiplayer game server for Connect Four
Provide reliable matchmaking with a competitive bot fallback
Persist leaderboard and game data
Demonstrate a decoupled analytics pipeline (Kafka) that does not affect gameplay
Features
Real-time 1v1 gameplay via Socket.IO
Matchmaking queue with bot fallback after 10s
Strategic bot (blocks immediate wins, attempts winning lines)
Game persistence + leaderboard (Postgres + Prisma)
Kafka-based analytics pipeline (producer + consumer)
Reconnect within 30s to resume; after 30s → forfeit
Local Docker Compose for single-node Kafka + Zookeeper (analytics only)
Tech stack
Backend: Node.js, Express, Socket.IO, Prisma, PostgreSQL
Analytics: Kafka (producer in backend, consumer as analytics service)
Frontend: React (Vite), socket.io-client, basic CSS
Infra: Docker (local Kafka), Render (backend hosting), Vercel (frontend hosting)
Project structure
backend/

Code
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/
├─ src/
│  ├─ index.js
│  ├─ socket/
│  │  └─ game.socket.js
│  ├─ kafka/
│  │  └─ producer.js
│  ├─ consumer.js        # Kafka analytics consumer (analytics service)
│  ├─ game/
│  │  ├─ gameLogic.js
│  │  ├─ gameManager.js
│  │  └─ botLogic.js
│  └─ routes/
│      └─ leaderboard.js
└─ .env
frontend/

Code
├─ src/
│  ├─ App.jsx
│  ├─ socket.js
│  └─ components/
│      ├─ Board.jsx
│      └─ Leaderboard.jsx
└─ vite.config.js
docker-compose.kafka.yml

Gameplay rules
Board: 7 columns × 6 rows
Players alternate dropping discs into columns
First to connect 4 in a row (horizontal, vertical, diagonal) wins
If board fills without a winner → draw
Matchmaking & bot
Player enters username and joins matchmaking queue
If no opponent within 10 seconds → competitive bot assigned
Bot strategy:
Blocks opponent's immediate winning moves
Attempts to create/extend winning paths
Avoids random play — deterministic, strategic fallback
Reconnect & forfeiture:

Reconnect within 30 seconds to resume
After 30 seconds of disconnect → opponent wins by forfeit
Realtime & socket events
Socket.IO is used for real-time gameplay and matchmaking.
Analytics events (GAME_STARTED, GAME_COMPLETED, GAME_FORFEITED) are produced to Kafka by a non-blocking producer.
Common socket events

JOIN_QUEUE { username }
MATCH_FOUND { gameId, players }
MAKE_MOVE { gameId, column }
GAME_STARTED
MOVE_MADE
GAME_COMPLETED
GAME_FORFEITED
RECONNECT { gameId, playerId }
Example client usage:

js
import { io } from "socket.io-client";

const socket = io("https://YOUR_BACKEND_URL", { auth: { username: "Alice" } });

socket.on("connect", () => console.log("connected", socket.id));
socket.on("GAME_STARTED", data => console.log("started", data));
socket.emit("JOIN_QUEUE", { username: "Alice" });
socket.emit("MAKE_MOVE", { gameId: "abc123", column: 3 });
Example GAME_STARTED payload:

JSON
{
  "type": "GAME_STARTED",
  "gameId": "abc123",
  "players": [
    { "id": "u1", "name": "Alice" },
    { "id": "u2", "name": "Bot-1", "isBot": true }
  ],
  "timestamp": "2025-12-23T12:00:00Z"
}
APIs
Leaderboard

GET /leaderboard — returns players and win counts (top players) Example:
bash
curl -s https://YOUR_BACKEND_URL/leaderboard | jq
Environment variables (example)
Create a .env in backend/ with the following values:

env
# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_ANALYTICS_TOPIC=game-analytics
KAFKA_CLIENT_ID=connect-four-backend
KAFKA_GROUP_ID=connect-four-analytics

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Optional analytics persistence
ANALYTICS_PERSIST_METRICS=true
KAFKAJS_NO_PARTITIONER_WARNING=1

# Frontend origin (CORS)
CLIENT_ORIGIN=https://YOUR_FRONTEND_URL
Run locally
Prerequisites:

Node.js >= 14
npm
Postgres (local or in Docker)
Docker (for Kafka if using analytics)
Clone
bash
git clone https://github.com/Prince-74/4-in-a-Row--Backend_Engineering_Intern_Assignment.git
cd 4-in-a-Row--Backend_Engineering_Intern_Assignment/backend
Install
bash
npm install
Prisma (if DB configured)
bash
npx prisma migrate dev    # run migrations
npx prisma generate
Start backend (dev)
bash
npm run dev
# runs Express + Socket.IO; producer emits analytics events if Kafka available
Start analytics consumer (optional)
bash
npm run analytics
# runs backend/consumer.js — computes and logs analytics snapshots
Kafka (analytics) local setup
Kafka is optional for gameplay (analytics only).

Start local Kafka (single-node) using Docker Compose:

bash
docker compose -f docker-compose.kafka.yml up -d
Tail logs:

bash
docker compose -f docker-compose.kafka.yml logs -f kafka zookeeper
Stop:

bash
docker compose -f docker-compose.kafka.yml down
End-to-end verification:

Start Kafka
Start backend
Start analytics consumer
Play a game to completion — consumer should log events like GAME_COMPLETED and snapshots:
Code
[analytics] received GAME_COMPLETED
=== Analytics Snapshot ===
Total games: 2
Average duration (s): 21
If DATABASE_URL is set and ANALYTICS_PERSIST_METRICS=true, metrics snapshots can be persisted via Prisma.

Deployment notes
Backend (Render)

Set DATABASE_URL to Render DB URL
Set CLIENT_ORIGIN to frontend URL
Kafka is not required in production for gameplay — analytics are optional
Frontend (Vercel)

Set VITE_BACKEND_URL to your Render backend URL
Cold starts on free Render plans are expected. Consider a periodic ping or an upgrade for more consistent responsiveness.

Troubleshooting
Backend unresponsive: allow 20–30s for cold start and retry.
Kafka errors: analytics producer is resilient — gameplay continues if Kafka is down.
DB errors: run npx prisma migrate dev and check DATABASE_URL.
Inspect DB: npx prisma studio
Tests: focus on core game logic (win detection, draw, bot decision) to ensure correctness.
Contributing
Fork, create a branch (e.g. feat/your-feature), implement, add tests for core game logic, open a PR with a clear description and screenshots where applicable.
