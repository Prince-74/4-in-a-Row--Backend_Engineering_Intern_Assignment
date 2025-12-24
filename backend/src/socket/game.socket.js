const {
  games,
  BOT_USERNAME,
  RECONNECT_TIMEOUT_MS,
  createGame,
  enqueuePlayer,
  dequeueOpponent,
  removeFromQueue,
  findGameByUsername,
  handlePlayerMove,
  handleBotMove,
  endGame,
} = require("../game/gameManager");

const { sendEvent } = require('../kafka/producer');

const { saveCompletedGame } = require("../db/prisma");

function initGameSocket(io) {
  io.on("connection", (socket) => {
    let username = null;
    let currentGameId = null;

    socket.on("JOIN_QUEUE", async (data) => {
      username = data.username;
      if (!username) return;
      const existing = findGameByUsername(username);
      if (existing) {
        existing.sockets[username] = socket.id;
        currentGameId = existing.gameId;
        socket.emit("GAME_START", {
          gameId: existing.gameId,
          board: existing.board,
          players: existing.players,
          turn: existing.turn,
          symbol: existing.symbols[username],
        });

        io.to(existing.gameId).emit("PLAYER_RECONNECTED", { username });

        clearTimeout(existing.reconnectTimeouts[username]);
        delete existing.reconnectTimeouts[username];
        return;
      }

      const opponentInfo = dequeueOpponent(username);
      if (opponentInfo) {
        const vsBot = false;
        const game = createGame(opponentInfo.username, username, vsBot);
        currentGameId = game.gameId;
        games.set(game.gameId, game);

        io.sockets.sockets.forEach((s) => {
          if (s.data && s.data.username === opponentInfo.username) {
            game.sockets[opponentInfo.username] = s.id;
            s.join(game.gameId);
            s.emit("GAME_START", {
              gameId: game.gameId,
              board: game.board,
              players: game.players,
              turn: game.turn,
              symbol: game.symbols[opponentInfo.username],
            });
          }
        });

        socket.join(game.gameId);
        game.sockets[username] = socket.id;
        socket.emit("GAME_START", {
          gameId: game.gameId,
          board: game.board,
          players: game.players,
          turn: game.turn,
          symbol: game.symbols[username],
        });

        // analytics: game started
        try {
          sendEvent(process.env.KAFKA_ANALYTICS_TOPIC || 'game-analytics', {
            type: 'GAME_STARTED',
            payload: {
              gameId: game.gameId,
              players: [game.players.player1, game.players.player2],
              winner: null,
              durationMs: 0,
              timestamp: new Date().toISOString(),
            },
          });
        } catch (err) {
          console.warn('Failed to send GAME_STARTED event to Kafka', err);
        }
      } else {
        enqueuePlayer(username);
        socket.data.username = username;

        setTimeout(() => {
          const waiting = games.has(currentGameId)
            ? null
            : findGameByUsername(username);
          if (!waiting) {
            removeFromQueue(username);
            const vsBot = true;
            const game = createGame(username, BOT_USERNAME, vsBot);
            currentGameId = game.gameId;
            games.set(game.gameId, game);
            socket.join(game.gameId);
            game.sockets[username] = socket.id;
            socket.emit("GAME_START", {
              gameId: game.gameId,
              board: game.board,
              players: game.players,
              turn: game.turn,
              symbol: game.symbols[username],
            });

            // analytics: game started (vs bot)
            try {
              sendEvent(process.env.KAFKA_ANALYTICS_TOPIC || 'game-analytics', {
                type: 'GAME_STARTED',
                payload: {
                  gameId: game.gameId,
                  players: [game.players.player1, game.players.player2],
                  winner: null,
                  durationMs: 0,
                  timestamp: new Date().toISOString(),
                },
              });
            } catch (err) {
              console.warn('Failed to send GAME_STARTED event to Kafka', err);
            }

            // Bot plays first move automatically
            if (game.turn === BOT_USERNAME) {
              setTimeout(() => {
                const botResult = handleBotMove(game);
                if (!botResult.error) {
                  io.to(game.gameId).emit("GAME_UPDATE", {
                    board: game.board,
                    turn: game.turn,
                    lastMove: botResult.lastMove,
                  });

                  if (botResult.status === "win" || botResult.status === "draw") {
                    const durationMs = new Date().getTime() - game.createdAt.getTime();
                    io.to(game.gameId).emit("GAME_OVER", {
                      status: botResult.status,
                      winner: botResult.winner || null,
                      board: game.board,
                      winningPositions: botResult.winningPositions || null,
                    });
                  }
                }
              }, 1000);
            }
          }
        }, 10_000);
      }
    });

    socket.on("PLAYER_MOVE", async ({ gameId, col }) => {
      const game = games.get(gameId);
      if (!game || !username) return; // invalid move request

      const result = handlePlayerMove(game, username, col);
      if (result.error) {
        socket.emit("GAME_UPDATE", { error: result.error });
        return;
      }

      io.to(gameId).emit("GAME_UPDATE", {
        board: game.board,
        turn: game.turn,
        lastMove: result.lastMove,
      });

      // Do not send gameplay (realtime) events to analytics; only emit start/end/forfeit per requirements

      if (result.status === "win" || result.status === "draw") {
        const durationMs = new Date().getTime() - game.createdAt.getTime();
        io.to(gameId).emit("GAME_OVER", {
          status: result.status,
          winner: result.winner || null,
          board: game.board,
          winningPositions: result.winningPositions || null,
        });

        // analytics event: game completed
        try {
          sendEvent(process.env.KAFKA_ANALYTICS_TOPIC || 'game-analytics', {
            type: 'GAME_COMPLETED',
            payload: {
              gameId,
              player1: game.players.player1,
              player2: game.players.player2,
              winner: result.winner || null,
              createdAt: game.createdAt,
              durationMs,
            },
          });
        } catch (err) {
          console.warn('Failed to send GAME_COMPLETED event to Kafka', err);
        }

        await saveCompletedGame({
          gameId,
          player1: game.players.player1,
          player2: game.players.player2,
          winner: result.winner || null,
          createdAt: game.createdAt,
          durationMs,
        });

        endGame(gameId);
        return;
      }

      if (game.vsBot && game.turn === BOT_USERNAME) {
        // small delay to simulate thinking time for the bot (500ms)
        await new Promise((res) => setTimeout(res, 750));

        const botResult = handleBotMove(game);
        if (botResult.error) return;

        io.to(gameId).emit("GAME_UPDATE", {
          board: game.board,
          turn: game.turn,
          lastMove: botResult.lastMove,
        });

        // Do not send gameplay updates to analytics

        if (botResult.status === "win" || botResult.status === "draw") {
          const durationMs = new Date().getTime() - game.createdAt.getTime();
          io.to(gameId).emit("GAME_OVER", {
            status: botResult.status,
            winner: botResult.winner || null,
            board: game.board,
            winningPositions: botResult.winningPositions || null,
          });

          await saveCompletedGame({
            gameId,
            player1: game.players.player1,
            player2: game.players.player2,
            winner: botResult.winner || null,
            createdAt: game.createdAt,
            durationMs,
          });

          // analytics event for bot game end
          try {
            sendEvent(process.env.KAFKA_ANALYTICS_TOPIC || 'game-analytics', {
              type: 'GAME_COMPLETED',
              payload: {
                gameId,
                player1: game.players.player1,
                player2: game.players.player2,
                winner: botResult.winner || null,
                createdAt: game.createdAt,
                durationMs,
              },
            });
          } catch (err) {
            console.warn('Failed to send bot GAME_COMPLETED event to Kafka', err);
          }

          endGame(gameId);
        }
      }
    });

    socket.on("disconnect", () => {
      if (!username) return;
      const game = findGameByUsername(username);
      if (!game) {
        removeFromQueue(username);
        return;
      }
      io.to(game.gameId).emit("PLAYER_DISCONNECTED", { username });
      const timeout = setTimeout(async () => {
        const g = games.get(game.gameId);
        if (!g) return;
        const opponent =
          g.players.player1 === username
            ? g.players.player2
            : g.players.player1;
        io.to(g.gameId).emit("GAME_OVER", {
          status: "forfeit",
          winner: opponent,
          board: g.board,
        });

        // analytics: game forfeited
        try {
          sendEvent(process.env.KAFKA_ANALYTICS_TOPIC || 'game-analytics', {
            type: 'GAME_FORFEITED',
            payload: {
              gameId: g.gameId,
              player1: g.players.player1,
              player2: g.players.player2,
              winner: opponent,
              createdAt: g.createdAt,
              durationMs,
            },
          });
        } catch (err) {
          console.warn('Failed to send GAME_FORFEITED event to Kafka', err);
        }

        const durationMs = new Date().getTime() - g.createdAt.getTime();

        await saveCompletedGame({
          gameId: g.gameId,
          player1: g.players.player1,
          player2: g.players.player2,
          winner: opponent,
          createdAt: g.createdAt,
          durationMs,
        });

        endGame(g.gameId);
      }, RECONNECT_TIMEOUT_MS);

      game.reconnectTimeouts[username] = timeout;
    });
  });
}

module.exports = { initGameSocket };
