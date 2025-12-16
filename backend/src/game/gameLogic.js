const ROWS = 6;
const COLS = 7;

function createEmptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function cloneBoard(board) {
  return board.map((row) => row.slice());
}

function getValidRow(board, col) {
  if (col < 0 || col >= COLS) return -1;
  for (let row = ROWS - 1; row >= 0; row -= 1) {
    if (!board[row][col]) return row;
  }
  return -1;
}

function applyMove(board, col, symbol) {
  const row = getValidRow(board, col);
  if (row === -1) return null;
  const next = cloneBoard(board);
  next[row][col] = symbol;
  return { board: next, row, col };
}

function checkDirection(board, row, col, dr, dc, symbol) {
  let count = 0;
  let r = row;
  let c = col;
  while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === symbol) {
    count += 1;
    r += dr;
    c += dc;
  }
  return count;
}

function checkWin(board, row, col) {
  const symbol = board[row][col];
  if (!symbol) return false;

  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  for (const [dr, dc] of directions) {
    const total =
      checkDirection(board, row, col, dr, dc, symbol) +
      checkDirection(board, row, col, -dr, -dc, symbol) -
      1;
    if (total >= 4) return true;
  }
  return false;
}

function isBoardFull(board) {
  return board.every((row) => row.every((cell) => cell !== null));
}

module.exports = {
  ROWS,
  COLS,
  createEmptyBoard,
  cloneBoard,
  getValidRow,
  applyMove,
  checkWin,
  isBoardFull,
};


