import React, { useEffect, useState } from 'react';
import { socket } from './socket';
import Board from './components/Board.jsx';
import Leaderboard from './components/Leaderboard.jsx';

function App() {
  const [username, setUsername] = useState('');
  const [submittedName, setSubmittedName] = useState('');
  const [gameId, setGameId] = useState(null);
  const [board, setBoard] = useState(null);
  const [turn, setTurn] = useState(null);
  const [symbol, setSymbol] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [gameOverInfo, setGameOverInfo] = useState(null);
  const [view, setView] = useState('game'); // 'game' | 'leaderboard'

  useEffect(() => {
    socket.on('GAME_START', (payload) => {
      setGameId(payload.gameId);
      setBoard(payload.board);
      setTurn(payload.turn);
      setSymbol(payload.symbol);
      setGameOverInfo(null);
      setStatusMessage('Game started!');
    });

    socket.on('GAME_UPDATE', (payload) => {
      if (payload.error) {
        setStatusMessage(payload.error);
        return;
      }
      setBoard(payload.board);
      setTurn(payload.turn);
    });

    socket.on('GAME_OVER', (payload) => {
      setBoard(payload.board);
      setGameOverInfo(payload);
      if (payload.status === 'draw') {
        setStatusMessage('Game ended in a draw.');
      } else if (payload.status === 'forfeit') {
        setStatusMessage(
          payload.winner === submittedName
            ? 'Opponent forfeited, you win!'
            : 'You forfeited the game.',
        );
      } else {
        setStatusMessage(
          payload.winner === submittedName ? 'You win!' : 'You lose.',
        );
      }
    });

    socket.on('PLAYER_DISCONNECTED', ({ username: u }) => {
      setStatusMessage(`${u} disconnected. Waiting 30s for reconnection...`);
    });

    socket.on('PLAYER_RECONNECTED', ({ username: u }) => {
      setStatusMessage(`${u} reconnected.`);
    });

    return () => {
      socket.off('GAME_START');
      socket.off('GAME_UPDATE');
      socket.off('GAME_OVER');
      socket.off('PLAYER_DISCONNECTED');
      socket.off('PLAYER_RECONNECTED');
    };
  }, [submittedName]);

  const handleJoin = (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    setSubmittedName(username.trim());
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit('JOIN_QUEUE', { username: username.trim() });
    setStatusMessage('Joined queue, waiting for opponent or bot...');
  };

  const handleColumnClick = (col) => {
    if (!gameId || !board || gameOverInfo) return;
    if (turn !== submittedName) {
      setStatusMessage('Not your turn.');
      return;
    }
    socket.emit('PLAYER_MOVE', { gameId, col });
  };

  const isMyTurn = gameId && turn === submittedName && !gameOverInfo;

  return (
    <div className="app">
      <h1>Connect Four Multiplayer</h1>

      <div className="top-bar">
        <button
          type="button"
          className={view === 'game' ? 'tab active' : 'tab'}
          onClick={() => setView('game')}
        >
          Game
        </button>
        <button
          type="button"
          className={view === 'leaderboard' ? 'tab active' : 'tab'}
          onClick={() => setView('leaderboard')}
        >
          Leaderboard
        </button>
      </div>

      <div className="content">
        <div className="left">
          <form onSubmit={handleJoin} className="username-form">
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <button type="submit" disabled={!username.trim()}>
              Join Queue
            </button>
          </form>

          <div className="status">
            <div>
              <strong>Player:</strong> {submittedName || '-'}
            </div>
            <div>
              <strong>Game ID:</strong> {gameId || '-'}
            </div>
            <div>
              <strong>Your symbol:</strong> {symbol || '-'}
            </div>
            <div>
              <strong>Turn:</strong> {turn || '-'}
            </div>
            <div>
              <strong>State:</strong> {statusMessage}
            </div>
            {isMyTurn && <div className="turn-indicator">Your turn</div>}
          </div>
        </div>

        <div className="right">
          {view === 'game' && (
            <Board board={board} onColumnClick={handleColumnClick} />
          )}
          {view === 'leaderboard' && <Leaderboard />}
        </div>
      </div>
    </div>
  );
}

export default App;


