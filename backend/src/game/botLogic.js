const { COLS, applyMove, checkWin } = require('./gameLogic');

function scoreBoard(board, symbol) {
  let score = 0;
  const centerCol = Math.floor(COLS / 2);
  for (let r = 0; r < board.length; r += 1) {
    for (let c = 0; c < board[0].length; c += 1) {
      if (board[r][c] === symbol) {
        score += 1;
        if (c === centerCol) score += 2;
      }
    }
  }
  return score;
}

function chooseBotMove(board, botSymbol, opponentSymbol) {
  const validCols = [];
  for (let c = 0; c < COLS; c += 1) {
    const sim = applyMove(board, c, botSymbol);
    if (sim) validCols.push(c);
  }
  if (validCols.length === 0) return null;

  for (const col of validCols) {
    const sim = applyMove(board, col, botSymbol);
    if (!sim) continue;
    if (checkWin(sim.board, sim.row, sim.col).win) return col;
  }

  for (const col of validCols) {
    const sim = applyMove(board, col, opponentSymbol);
    if (!sim) continue;
    if (checkWin(sim.board, sim.row, sim.col).win) return col;
  }

  let bestCol = validCols[0];
  let bestScore = -Infinity;
  for (const col of validCols) {
    const sim = applyMove(board, col, botSymbol);
    if (!sim) continue;
    const s = scoreBoard(sim.board, botSymbol);
    if (s > bestScore) {
      bestScore = s;
      bestCol = col;
    }
  }
  return bestCol;
}

module.exports = { chooseBotMove };


