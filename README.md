# 🎯 4 in a Row (Connect Four) — Backend Engineering Intern Assignment

A real-time multiplayer Connect Four (4 in a Row) game built as part of a Backend Engineering Intern Assignment.
The system supports 1v1 gameplay, bot fallback, leaderboard, and decoupled game analytics using Kafka.

## 🔗 Live Demo

- **Live Link**: https://4-connect-multiplayer.vercel.app/
- 
- ### ⚠️ Important (Render Cold Start)
The backend is hosted on Render (free tier).
If the app does not respond immediately, wait 20–30 seconds and refresh — the backend may be waking up.

---

## 🧠 Objective (Assignment Requirements)

✅ Real-time multiplayer game server

✅ Player matchmaking with bot fallback after 10 seconds

✅ Strategic bot (blocks wins, tries to win)

✅ WebSocket-based real-time gameplay

✅ Game persistence + leaderboard

✅ Kafka-based decoupled analytics

---

## 🛠 Tech Stack

### Backend
- Node.js
- Express
- Socket.IO
- PostgreSQL
- Prisma ORM
- Kafka (analytics only)

### Frontend
- React (Vite)
- socket.io-client
- Basic CSS

### Infra / Tools
- Docker (for local Kafka)
- Render (backend hosting)
- Vercel (frontend hosting)

---

## Project Structure

```
backend/
 ├─ prisma/
 │   ├─ schema.prisma
 │   └─ migrations/
 ├─ src/
 │   ├─ index.js
 │   ├─ socket/
 │   │   └─ game.socket.js
 │   ├─ kafka/
 │   │   └─ producer.js
 │   ├─ consumer.js        # Kafka analytics consumer
 │   ├─ game/
 │   │   ├─ gameLogic.js
 │   │   ├─ gameManager.js
 │   │   └─ botLogic.js
 │   └─ routes/
 │       └─ leaderboard.js
 └─ .env

frontend/
 ├─ src/
 │   ├─ App.jsx
 │   ├─ socket.js
 │   └─ components/
 │       ├─ Board.jsx
 │       └─ Leaderboard.jsx
 └─ vite.config.js

docker-compose.kafka.yml
```

---

## 🕹 Gameplay Rules

- **Board size**: 7 × 6
- **Players take turns** dropping discs
- **First to connect 4** in a row (horizontal / vertical / diagonal) wins
- **Full board without winner** → Draw

---

## 🤖 Matchmaking & Bot

1. Player enters a username and joins the queue
2. If no opponent joins within **10 seconds**, a competitive bot starts
3. **Bot logic**:
   - Blocks opponent's immediate win
   - Tries to create winning paths
   - Never plays random moves

---

## 🌐 Real-Time Gameplay (WebSockets)

All moves and turns are synced via Socket.IO

**If a player disconnects**:
- They can rejoin within 30 seconds
- After 30 seconds → game forfeited

---

## 🏅 Leaderboard

- Tracks games won per player
- Stored in PostgreSQL
- Displayed on frontend

**API**:
```
GET /leaderboard
```

---

## 💥 Kafka Analytics (Bonus Requirement)

Kafka is used **only for analytics**, not for gameplay.

### What was implemented

#### Producer
`backend/src/kafka/producer.js`
- Emits analytics events to Kafka topic `game-analytics`
- Resilient (non-fatal if Kafka is down)

#### Consumer (Analytics Service)
`backend/consumer.js`
- Consumes analytics events
- Computes in-memory metrics
- Optionally persists snapshots to Postgres

#### Socket Wiring
`backend/src/socket/game.socket.js`
- Emits lifecycle events only:
  - `GAME_STARTED`
  - `GAME_COMPLETED`
  - `GAME_FORFEITED`

#### Docker Compose
`docker-compose.kafka.yml`
- Local single-node Kafka + Zookeeper

#### Prisma Metrics Model
- Stores analytics snapshots (optional)

---

## 📊 Analytics Metrics Tracked

- Total games played
- Average game duration
- Most frequent winners
- Games per day

Metrics are logged by the consumer and optionally stored in DB.

---

## 🔑 Environment Variables

```
# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_ANALYTICS_TOPIC=game-analytics
KAFKA_CLIENT_ID=connect-four-backend
KAFKA_GROUP_ID=connect-four-analytics

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Optional
ANALYTICS_PERSIST_METRICS=true
KAFKAJS_NO_PARTITIONER_WARNING=1
```

---

## ▶️ How to Run Kafka Locally (For Analytics)

Kafka is **not required for gameplay**.
It is used only to demonstrate decoupled analytics as per assignment.

### Start Kafka
```bash
docker compose -f docker-compose.kafka.yml up -d
```

### View logs
```bash
docker compose -f docker-compose.kafka.yml logs -f kafka zookeeper
```

### Stop Kafka
```bash
docker compose -f docker-compose.kafka.yml down
```

---

## ▶️ Run Backend & Consumer (Local)

```bash
cd backend
npm install
npm run dev          # start backend (producer runs here)
```

**In another terminal**:
```bash
cd backend
npm run analytics    # start Kafka consumer
```

---

## ▶️ How to Verify Kafka End-to-End

1. Start Kafka via Docker
2. Start backend
3. Start analytics consumer
4. Play a game to completion
5. **Observe**:
   - Consumer logs like:
     ```
     [analytics] received GAME_COMPLETED
     === Analytics Snapshot ===
     Total games: 2
     Average duration (s): 21
     ```
   - If `DATABASE_URL` is set → check Prisma Studio for Metrics table

---

## 🚀 Deployment Notes

### Backend (Render)

- Set `DATABASE_URL` (Render internal DB URL)
- Set `CLIENT_ORIGIN=https://YOUR_FRONTEND_URL`
- Kafka is **not required** in production for gameplay

### Frontend (Vercel)

Set:
```
VITE_BACKEND_URL=https://YOUR_RENDER_BACKEND_URL
```

---

## 📌 Important Notes 

- **Kafka is intentionally decoupled** from gameplay
- **Gameplay continues even if Kafka is unavailable**
- **Kafka + consumer** are run locally using Docker for analytics demonstration
- This mirrors a real-world async analytics pipeline

---

## 🧠 Design Justification 

Kafka is used to asynchronously process analytics events without impacting real-time gameplay.

---

## ✅ Assignment Status

- ✔️ Real-time multiplayer
- ✔️ Bot fallback
- ✔️ Leaderboard
- ✔️ Kafka analytics
- ✔️ App hosted``bash
cd backend && npm start
```

#### Common deployment pitfall: CORS origin format

If you set:
- `CLIENT_ORIGIN=4-connect-multiplayer.vercel.app`

Socket.IO will fail with a CORS error because the origin header becomes invalid.

Correct:
- `CLIENT_ORIGIN=https://4-connect-multiplayer.vercel.app`

### Frontend (Vercel)

Set env var:
- `VITE_BACKEND_URL=https://YOUR_RENDER_BACKEND_DOMAIN`

Redeploy after changing env vars.

---

## Troubleshooting

### Port already in use (EADDRINUSE)

If backend fails on port 4000, either stop the existing process using the port, or set:

```bash
PORT=4001
```

Then update frontend `VITE_BACKEND_URL` accordingly.

### Prisma can’t connect (P1001 / localhost in production)

If logs show Prisma trying `localhost:5432` in production:
- your `DATABASE_URL` is wrong
- set it to your hosted Postgres URL (Render Internal URL if backend is on Render)


