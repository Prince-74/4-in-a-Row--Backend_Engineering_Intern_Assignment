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
 */
function Board({ board, onColumnClick, disabled }) {
  const displayBoard = board || Array.from({ length: 6 }, () => Array(7).fill(null));

  const handleColumnClick = (col) => {
    if (!disabled && typeof onColumnClick === 'function') onColumnClick(col);
  };

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
      </div>

      <div className="board-base" aria-hidden="true" />
    </div>
  );
}

export default Board;



