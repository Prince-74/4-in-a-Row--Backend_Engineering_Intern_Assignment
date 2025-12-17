# 4 in a Row (Connect Four) — Real‑Time Multiplayer (Full‑Stack)

Real-time multiplayer **Connect Four** using:
- **Backend**: Node.js + Express + Socket.IO
- **Database**: PostgreSQL + Prisma (stores only completed games + leaderboard)
- **Frontend**: React (Vite) + socket.io-client + plain CSS

> Note: **Kafka is not included/enabled in this repo right now**.

---

## Project Structure

```
backend/
  prisma/
    schema.prisma
    migrations/
  src/
    index.js
    socket/
      game.socket.js
    game/
      gameManager.js
      gameLogic.js
      botLogic.js
    routes/
      leaderboard.js
    db/
      prisma.js
frontend/
  index.html
  vite.config.js
  src/
    App.jsx
    socket.js
    components/
      Board.jsx
      Leaderboard.jsx
```

---

## Requirements

- **Node.js 18+**
- **PostgreSQL 13+**
- npm

---

## Local Setup (Step-by-step)

### 1) Create a PostgreSQL database

Create a database (example name `four_connect`).

### 2) Backend environment variables

Create `backend/.env`:

```bash
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/four_connect?schema=public"
CLIENT_ORIGIN="http://localhost:5173"
PORT=4000
```

### 3) Install backend dependencies

```bash
cd backend
npm install
```

### 4) Run Prisma migrations + generate client

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

### 5) Start backend

```bash
cd backend
npm start
```

Backend runs on `http://localhost:4000`.

### 6) Frontend environment variables

Create `frontend/.env`:

```bash
VITE_BACKEND_URL="http://localhost:4000"
```

### 7) Install frontend dependencies + start

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

---

## How to Play

1. Open the frontend in two browser windows (or two devices).
2. Enter a username and click **Join Queue**.
3. If another player joins within **10 seconds**, a **1v1** game starts.
4. If nobody joins within **10 seconds**, you play vs **BOT**.
5. Click any column to drop a disc.

Rules:
- Board is **7 columns × 6 rows**
- 4 in a row wins (horizontal, vertical, diagonal)
- Draw when board fills and there is no winner

---

## Socket.IO Event Flow (Quick Reference)

Client → Server:
- `JOIN_QUEUE` `{ username }`
- `PLAYER_MOVE` `{ gameId, col }`

Server → Client:
- `GAME_START` `{ gameId, board, players, turn, symbol }`
- `GAME_UPDATE` `{ board, turn, lastMove }` or `{ error }`
- `GAME_OVER` `{ status, winner, board }`
- `PLAYER_DISCONNECTED` `{ username }`
- `PLAYER_RECONNECTED` `{ username }`

---

## Leaderboard

Backend endpoint:
- `GET /leaderboard`

It returns players sorted by `gamesWon` descending.

Example SQL (PostgreSQL):

```sql
SELECT id, username, "gamesWon"
FROM "Player"
ORDER BY "gamesWon" DESC, username ASC;
```

---

## Deployment Notes

### Backend (Render)

1. Create a **Render PostgreSQL** database.
2. In the backend Render service, set env vars:
   - `DATABASE_URL` = **Render Internal Database URL** (not localhost)
   - `CLIENT_ORIGIN` = `https://YOUR_FRONTEND_DOMAIN` (must include `https://`)
3. Use a build command that applies migrations:

```bash
cd backend && npm install && npx prisma generate && npx prisma migrate deploy
```

4. Start command:

```bash
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


