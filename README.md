🎯 4 in a Row (Connect Four) — Backend Engineering Intern Assignment
====================================================================

A real-time multiplayer Connect Four (4 in a Row) game built as part of a Backend Engineering Intern Assignment. The system supports 1v1 gameplay, bot fallback, leaderboard, and decoupled game analytics using Kafka.

🔗 Live Demo
------------

*   **Live Link**: [4-connect-multiplayer.vercel.app](https://4-connect-multiplayer.vercel.app/)
    
*   **⚠️ Important (Render Cold Start)**: The backend is hosted on Render (free tier). If the app does not respond immediately, wait 20–30 seconds and refresh — the backend may be waking up.
    

🧠 Objective (Assignment Requirements)
--------------------------------------

*   ✅ Real-time multiplayer game server
    
*   ✅ Player matchmaking with bot fallback after 10 seconds
    
*   ✅ Strategic bot (blocks wins, tries to win)
    
*   ✅ WebSocket-based real-time gameplay
    
*   ✅ Game persistence + leaderboard
    
*   ✅ Kafka-based decoupled analytics
    

🛠 Tech Stack
-------------

**ComponentTechnologiesBackend**Node.js, Express, Socket.IO, PostgreSQL, Prisma ORM, Kafka**Frontend**React (Vite), socket.io-client, CSS**Infra / Tools**Docker (Local Kafka), Render (Backend), Vercel (Frontend)

📂 Project Structure
--------------------

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

▶️ How to Download & Run the Project (Local Setup)
--------------------------------------------------

Follow the steps below to set up and run the project locally.

### 1\. Clone the Repository

Bash

`git clone https://github.com/Prince-74/4-in-a-Row--Backend_Engineering_Intern_Assignment.git  cd 4-in-a-Row--Backend_Engineering_Intern_Assignment   `

### 2\. Backend Setup

Bash

 cd backend  npm install   `

### 3\. Configure Environment Variables (Backend)

Create a .env file inside the backend folder:

Code snippet

`PORT=4000  DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE  CLIENT_ORIGIN=http://localhost:5173  # Kafka (optional – for analytics)  KAFKA_BROKERS=localhost:9092  KAFKA_ANALYTICS_TOPIC=game-analytics  KAFKA_CLIENT_ID=connect-four-backend  KAFKA_GROUP_ID=connect-four-analytics  ANALYTICS_PERSIST_METRICS=true  KAFKAJS_NO_PARTITIONER_WARNING=1   `

> **Note**: Kafka is optional. The game works fully without Kafka.

### 4\. Setup PostgreSQL & Prisma

Bash
`npx prisma migrate dev  npx prisma generate  # (Optional) Open Prisma Studio  npx prisma studio   `

### 5\. Start Backend Server

Bash
`npm start  # Available at: http://localhost:4000   `

### 6\. (Optional) Run Kafka for Analytics

`# Start Kafka using Docker  docker compose -f docker-compose.kafka.yml up -d  # Start the Kafka consumer (in a new terminal)  cd backend  npm run analytics   `

### 7\. Frontend Setup

`cd frontend  npm install  # Create .env file  echo "VITE_BACKEND_URL=http://localhost:4000" > .env  # Start frontend  npm run dev  # Available at: http://localhost:5173   `

🕹 Gameplay Rules
-----------------

*   **Board size**: 7 × 6
    
*   **Mechanic**: Players take turns dropping discs.
    
*   **Win Condition**: First to connect 4 in a row (horizontal, vertical, or diagonal).
    
*   **Draw**: Full board without a winner.
    

🤖 Matchmaking & Bot
--------------------

1.  Player enters a username and joins the queue.
    
2.  If no opponent joins within **10 seconds**, a competitive bot starts.
    
3.  **Bot logic**:
    
    *   Blocks opponent's immediate win.
        
    *   Tries to create winning paths.
        
    *   Never plays random moves.
        

🌐 Real-Time Gameplay (WebSockets)
----------------------------------

All moves and turns are synced via **Socket.IO**.

*   **Reconnection**: If a player disconnects, they can rejoin within 30 seconds.
    
*   **Forfeit**: After 30 seconds of disconnection, the game is forfeited.
    

🏅 Leaderboard
--------------

Tracks games won per player, stored in PostgreSQL.

*   **API Endpoint**: GET /leaderboard
    

💥 Kafka Analytics (Bonus Requirement)
--------------------------------------

Kafka is used **only for analytics**, decoupled from the core gameplay loop.

### Implementation Details

*   **Producer**: backend/src/kafka/producer.js emits events (GAME\_STARTED, GAME\_COMPLETED, GAME\_FORFEITED).
    
*   **Consumer**: backend/consumer.js computes in-memory metrics and persists snapshots to Postgres.
    
*   **Resilience**: The game remains fully functional even if Kafka is down.
    

### 📊 Metrics Tracked

*   Total games played
    
*   Average game duration
    
*   Most frequent winners
    
*   Games per day
    

🔑 Environment Variables Reference
----------------------------------

**VariableDescription**KAFKA\_BROKERSList of Kafka brokersDATABASE\_URLPostgreSQL connection stringCLIENT\_ORIGINAllowed CORS origin (Frontend URL)ANALYTICS\_PERSIST\_METRICSWhether to save metrics to DB

🚀 Deployment Notes
-------------------

### Backend (Render)

*   Set DATABASE\_URL (Render internal DB URL).
    
*   Set CLIENT\_ORIGIN=https://YOUR\_FRONTEND\_URL (Ensure https:// is included).
    

### Frontend (Vercel)

*   Set VITE\_BACKEND\_URL=https://YOUR\_RENDER\_BACKEND\_URL.
    

📌 Important Design Justification
---------------------------------

*   **Decoupling**: Kafka is intentionally decoupled. This mirrors a real-world async analytics pipeline where high-traffic gameplay is not slowed down by data processing tasks.
    
*   **Fault Tolerance**: Gameplay continues even if the analytics service or Kafka is unavailable.
    

🛠 Troubleshooting
------------------

*   **CORS Errors**: Ensure CLIENT\_ORIGIN matches your frontend URL exactly (including https://).
    
*   **Port in Use (EADDRINUSE)**: If port 4000 is taken, set PORT=4001 in .env and update the frontend accordingly.
