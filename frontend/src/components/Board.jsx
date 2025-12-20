import React from 'react';

/**
 * Board Component
 *
 * Renders a stylized 7x6 Connect Four board. Each grid cell is a "hole"
 * (white circular cutout) inside the blue panel. When a cell contains a
 * piece we render a beveled disc centered inside the hole.
 *
 * Props:
 * - board: 2D array [6][7] with values 'R' | 'Y' | null
 * - onColumnClick(colIndex): called when the user clicks any cell in a column
 * - disabled: boolean to prevent interaction
 * - winningPositions: array of [row, col] coordinates representing the winning line
 */
function Board({ board, onColumnClick, disabled, winningPositions }) {
  const displayBoard = board || Array.from({ length: 6 }, () => Array(7).fill(null));

  const handleColumnClick = (col) => {
    if (!disabled && typeof onColumnClick === 'function') onColumnClick(col);
  };

  // Calculate line coordinates for winning positions
  const getLineCoordinates = () => {
    if (!winningPositions || winningPositions.length < 2) return null;

    // Get CSS custom properties for responsive sizing
    const root = document.documentElement;
    const cellSize = parseFloat(getComputedStyle(root).getPropertyValue('--cell-size')) || 50;
    const cellGap = parseFloat(getComputedStyle(root).getPropertyValue('--cell-gap')) || 6;
    const boardPad = parseFloat(getComputedStyle(root).getPropertyValue('--board-pad')) || 16;

    // Get first and last positions
    const [r1, c1] = winningPositions[0];
    const [r2, c2] = winningPositions[winningPositions.length - 1];

    // Calculate center positions in pixels
    const x1 = boardPad + c1 * (cellSize + cellGap) + cellSize / 2;
    const y1 = boardPad + r1 * (cellSize + cellGap) + cellSize / 2;
    const x2 = boardPad + c2 * (cellSize + cellGap) + cellSize / 2;
    const y2 = boardPad + r2 * (cellSize + cellGap) + cellSize / 2;

    return { x1, y1, x2, y2 };
  };

  const lineCoords = getLineCoordinates();

  return (
    <div className="board-wrapper">
      <div className="board" role="grid" aria-label="Connect Four board">
        {displayBoard.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              role="gridcell"
              className="cell"
              title={`Column ${colIndex + 1}`}
              onClick={() => handleColumnClick(colIndex)}
              aria-disabled={disabled}
              tabIndex={0}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
                  e.preventDefault();
                  handleColumnClick(colIndex);
                }
              }}
            >
              <div className="hole">
                {cell === 'R' && <span className="disc red" aria-hidden="true"></span>}
                {cell === 'Y' && <span className="disc yellow" aria-hidden="true"></span>}
              </div>
            </div>
          ))
        )}
        {lineCoords && (
          <svg className="winning-line" aria-hidden="true">
            <line
              x1={lineCoords.x1}
              y1={lineCoords.y1}
              x2={lineCoords.x2}
              y2={lineCoords.y2}
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>

      <div className="board-base" aria-hidden="true" />
    </div>
  );
}

export default Board;



