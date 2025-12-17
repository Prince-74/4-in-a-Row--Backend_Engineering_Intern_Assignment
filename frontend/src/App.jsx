import React, { useEffect, useState } from 'react';
import { socket } from './socket';
import WelcomeScreen from './components/WelcomeScreen';
import Board from './components/Board';
import Leaderboard from './components/Leaderboard';

/**
 * App Component
 * 
 * Main application entry point:
 * 1. Shows welcome screen until user enters username
 * 2. Once username is set, shows game board and leaderboard tabs
 * 3. Manages all socket events (game start, moves, game over, etc.)
 * 4. Handles game state and UI updates
 */
function App() {
  // User identity
  const [username, setUsername] = useState('');
  
  // Game state
  const [gameId, setGameId] = useState(null);
  const [board, setBoard] = useState(null);
  const [turn, setTurn] = useState(null);
  const [symbol, setSymbol] = useState(null);
  const [gameOverInfo, setGameOverInfo] = useState(null);
  
  // UI state
  const [view, setView] = useState('game'); // 'game' | 'leaderboard'
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('info'); // 'info' | 'error' | 'success'

  /**
   * Socket.IO event listeners setup
   * Listen for game events from the backend
   */
  useEffect(() => {
    if (!username) return; // Don't set up listeners until username is set

    // Game started: initial setup with board and player info
    socket.on('GAME_START', (payload) => {
      setGameId(payload.gameId);
      setBoard(payload.board);
      setTurn(payload.turn);
      setSymbol(payload.symbol);
      setGameOverInfo(null);
      setStatusMessage('Game started!');
      setStatusType('success');
    });

    // Game update: move played, board updated
    socket.on('GAME_UPDATE', (payload) => {
      if (payload.error) {
        setStatusMessage(payload.error);
        setStatusType('error');
        return;
      }
      setBoard(payload.board);
      setTurn(payload.turn);
      setStatusMessage('');
    });

    // Game over: handle win/loss/draw/forfeit
    socket.on('GAME_OVER', (payload) => {
      setBoard(payload.board);
      setGameOverInfo(payload);
      
      if (payload.status === 'draw') {
        setStatusMessage('Game ended in a draw.');
        setStatusType('info');
      } else if (payload.status === 'forfeit') {
        const isMyForfeit = payload.winner !== username;
        setStatusMessage(
          isMyForfeit
            ? 'You forfeited the game.'
            : 'Opponent forfeited, you win!'
        );
        setStatusType(isMyForfeit ? 'error' : 'success');
      } else {
        const isWin = payload.winner === username;
        setStatusMessage(isWin ? 'You win! 🎉' : 'You lose.');
        setStatusType(isWin ? 'success' : 'error');
      }
    });

    // Player disconnected: notify user
    socket.on('PLAYER_DISCONNECTED', ({ username: u }) => {
      setStatusMessage(`${u} disconnected. Waiting 30s for reconnection...`);
      setStatusType('info');
    });

    // Player reconnected: notify user
    socket.on('PLAYER_RECONNECTED', ({ username: u }) => {
      setStatusMessage(`${u} reconnected.`);
      setStatusType('success');
    });

    // Cleanup listeners on unmount or username change
    return () => {
      socket.off('GAME_START');
      socket.off('GAME_UPDATE');
      socket.off('GAME_OVER');
      socket.off('PLAYER_DISCONNECTED');
      socket.off('PLAYER_RECONNECTED');
    };
  }, [username]);

  /**
   * Handle welcome screen submission
   * Initialize socket connection and join queue
   */
  const handleWelcomeStart = (enteredUsername) => {
    setUsername(enteredUsername);
    
    // Connect socket if not already connected
    if (!socket.connected) {
      socket.connect();
    }
    
    // Emit join queue event
    socket.emit('JOIN_QUEUE', { username: enteredUsername });
    setStatusMessage('Joining queue, waiting for opponent or bot...');
    setStatusType('info');
  };

  /**
   * Handle column click for move
   * Validate turn and emit move event
   */
  const handleColumnClick = (col) => {
    // Precondition checks
    if (!gameId || !board || gameOverInfo) {
      return;
    }

    // Verify it's the player's turn
    if (turn !== username) {
      setStatusMessage('Not your turn.');
      setStatusType('error');
      return;
    }

    // Emit move to server
    socket.emit('PLAYER_MOVE', { gameId, col });
  };

  // Derived state: is it player's turn?
  const isMyTurn = gameId && turn === username && !gameOverInfo;

  // Show welcome screen if no username yet
  if (!username) {
    return <WelcomeScreen onStart={handleWelcomeStart} />;
  }

  // Main game UI
  return (
    <div className="app">
      {/* Header with title and tabs */}
      <header className="header">
        <div className="header-content">
          <h1>Connect-4 Multiplayer</h1>
          <div className="tabs">
            <button
              type="button"
              className={`tab ${view === 'game' ? 'active' : ''}`}
              onClick={() => setView('game')}
            >
              Game
            </button>
            <button
              type="button"
              className={`tab ${view === 'leaderboard' ? 'active' : ''}`}
              onClick={() => setView('leaderboard')}
            >
              Leaderboard
            </button>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="main-content">
        <div className="content">
          {/* Left panel: player info */}
          <aside className="left">
            <div className="info-card">
              <div className="info-row">
                <span className="info-label">Player</span>
                <span className="info-value">
                  {username || <span className="empty">-</span>}
                </span>
              </div>

              <div className="info-row">
                <span className="info-label">Symbol</span>
                <span className="info-value">
                  {symbol ? (
                    <span style={{ fontSize: '20px' }}>
                      {symbol === 'R' ? '🔴' : '🟡'}
                    </span>
                  ) : (
                    <span className="empty">-</span>
                  )}
                </span>
              </div>

              <div className="info-row">
                <span className="info-label">Game ID</span>
                <span className="info-value" title={gameId || ''}>
                  {gameId ? gameId.substring(0, 8) + '...' : <span className="empty">-</span>}
                </span>
              </div>

              <div className="info-row">
                <span className="info-label">Current Turn</span>
                <span className="info-value">
                  {turn || <span className="empty">-</span>}
                </span>
              </div>

              {isMyTurn && (
                <div className="turn-indicator">
                  ⬆️ Your Turn
                </div>
              )}
            </div>

            {statusMessage && (
              <div className={`status-message ${statusType}`}>
                {statusMessage}
              </div>
            )}
          </aside>

          {/* Right panel: game board or leaderboard */}
          <section className="right">
            {view === 'game' && (
              <div className="board-container">
                <Board
                  board={board}
                  onColumnClick={handleColumnClick}
                  disabled={!isMyTurn}
                />
              </div>
            )}
            {view === 'leaderboard' && <Leaderboard />}
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;



