const { v4: uuidv4 } = require('uuid');
const {
  createEmptyBoard,
  applyMove,
  checkWin,
  isBoardFull,
} = require('./gameLogic');
const { chooseBotMove } = require('./botLogic');

const games = new Map();
const waitingQueue = new Map(); 
const RECONNECT_TIMEOUT_MS = 30_000; // allow 30s to reconnect
const BOT_USERNAME = 'BOT';

function createGame(player1, player2, vsBot = false) {
  const gameId = uuidv4();
  const board = createEmptyBoard();
  const createdAt = new Date();
  const game = {
    gameId,
    board,
    players: {
      player1,
      player2,
    },
    sockets: {}, 
    symbols: {
      [player1]: 'R',
      [player2]: 'Y',
    },
    turn: player1, 
    vsBot,
    createdAt,
    updatedAt: createdAt,
    reconnectTimeouts: {},
  };
  games.set(gameId, game);
  return game;
}

function enqueuePlayer(username) {
  waitingQueue.set(username, { username, joinedAt: Date.now() });
}

function dequeueOpponent(excludeUsername) {
  for (const [username, info] of waitingQueue) {
    if (username !== excludeUsername) {
      waitingQueue.delete(username);
      return info;
    }
  }
  return null;
}

function removeFromQueue(username) {
  waitingQueue.delete(username);
}

function findGameByUsername(username) {
  for (const game of games.values()) {
    if (game.players.player1 === username || game.players.player2 === username) {
      return game;
    }
  }
  return null;
}

function handlePlayerMove(game, username, col) {
  if (game.turn !== username) {
    return { error: 'Not your turn' };
  }
  const symbol = game.symbols[username];

  const applied = applyMove(game.board, col, symbol);
  if (!applied) return { error: 'Invalid move' };

  game.board = applied.board;
  game.turn =
    username === game.players.player1
      ? game.players.player2
      : game.players.player1;
  game.updatedAt = new Date();

  if (checkWin(game.board, applied.row, applied.col)) {
    return { status: 'win', winner: username, lastMove: applied };
  }
  if (isBoardFull(game.board)) {
    return { status: 'draw', lastMove: applied };
  }
  return { status: 'continue', lastMove: applied };
}

function handleBotMove(game) {
  const botUsername = BOT_USERNAME;
  const botSymbol = game.symbols[botUsername];
  const opponent =
    game.players.player1 === botUsername
      ? game.players.player2
      : game.players.player1;
  const opponentSymbol = game.symbols[opponent];

  const col = chooseBotMove(game.board, botSymbol, opponentSymbol);
  if (col == null) return { error: 'No valid moves' };

  const applied = applyMove(game.board, col, botSymbol);
  if (!applied) return { error: 'Invalid bot move' };

  game.board = applied.board;
  game.turn = opponent;
  game.updatedAt = new Date();

  if (checkWin(game.board, applied.row, applied.col)) {
    return { status: 'win', winner: botUsername, lastMove: applied };
  }
  if (isBoardFull(game.board)) {
    return { status: 'draw', lastMove: applied };
  }
  return { status: 'continue', lastMove: applied };
}

function endGame(gameId) {
  games.delete(gameId);
}

module.exports = {
  games,
  waitingQueue,
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
};


