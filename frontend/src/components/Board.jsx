import React from 'react';

function Board({ board, onColumnClick }) {
  const displayBoard =
    board ||
    Array.from({ length: 6 }, () => Array(7).fill(null));

  return (
    <div className="board">
      {displayBoard.map((row, rIndex) => (
        <div key={rIndex} className="board-row">
          {row.map((cell, cIndex) => (
            <button
              key={cIndex}
              type="button"
              className={`cell ${cell === 'R' ? 'red' : ''} ${
                cell === 'Y' ? 'yellow' : ''
              }`}
              onClick={() => onColumnClick(cIndex)}
            >
              {cell || ''}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

export default Board;


