import React, { useEffect, useState, useRef } from 'react';
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
  const [winningPositions, setWinningPositions] = useState(null);
  const [opponent, setOpponent] = useState(null); // opponent username or 'BOT'
  const [vsBot, setVsBot] = useState(false); // track if playing vs bot
  
  // UI state
  const [view, setView] = useState('game'); // 'game' | 'leaderboard'
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('info'); // 'info' | 'error' | 'success'
  const [countdown, setCountdown] = useState(null); // seconds left until bot match
  const countdownRef = useRef(null);

  /**
   * Socket.IO event listeners setup
   * Listen for game events from the backend
   */
  useEffect(() => {
    if (!username) return; // Don't set up listeners until username is set

    // Game started: initial setup with board and player info
    socket.on('GAME_START', (payload) => {
      // stop any pending queue countdown
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      setCountdown(null);
      setGameId(payload.gameId);
      setBoard(payload.board);
      setTurn(payload.turn);
      setSymbol(payload.symbol);
      setGameOverInfo(null);
      
      // Determine opponent
      const opponentName = payload.players.player1 === username 
        ? payload.players.player2 
        : payload.players.player1;
      const isBotMatch = opponentName === 'BOT';
      setOpponent(opponentName);
      setVsBot(isBotMatch);
      
      // Set match notification
      if (isBotMatch) {
        setStatusMessage('🤖 Matched with BOT! Game started!');
      } else {
        setStatusMessage(`✅ Matched with ${opponentName}! Game started!`);
      }
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
      setWinningPositions(payload.winningPositions || null);
      
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
      setOpponent(null);
      setVsBot(false);
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
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
    // start 10s countdown until server may match with bot
    startQueueCountdown(10);
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

  /**
   * Play again handler - rejoin the queue using the same username
   * Clears current game state so the server can start a new match.
   */
  const handlePlayAgain = () => {
    if (!username) return;
    // ensure socket connected
    if (!socket.connected) socket.connect();
    // clear local game state while we wait for a new GAME_START
    setGameId(null);
    setBoard(null);
    setTurn(null);
    setSymbol(null);
    setGameOverInfo(null);
    setWinningPositions(null);
    setOpponent(null);
    setVsBot(false);
    setStatusMessage(`${username} can play again`);
    setStatusType('info');
    // emit join queue
    socket.emit('JOIN_QUEUE', { username });
    // restart queue countdown
    startQueueCountdown(10);
  };

  function startQueueCountdown(seconds) {
    // clear existing
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setCountdown(seconds);
    countdownRef.current = setInterval(() => {
      setCountdown((s) => {
        if (s === null) return null;
        if (s <= 1) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
          return null;
        }
        return s - 1;
      });
    }, 1000);
  }

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
                <span className="info-label">Opponent</span>
                <span className="info-value">
                  {opponent ? (
                    <span>
                      {vsBot ? '🤖 BOT' : opponent}
                    </span>
                  ) : (
                    <span className="empty">-</span>
                  )}
                </span>
              </div>

              <div className="info-row">
                <span className="info-label">Current Turn</span>
                <span className="info-value">
                  {turn ? (
                    <span>
                      {turn === username ? (
                        <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>Your Turn ⬆️</span>
                      ) : (
                        <span>{turn === 'BOT' ? '🤖 BOT' : opponent || turn}</span>
                      )}
                    </span>
                  ) : (
                    <span className="empty">-</span>
                  )}
                </span>
              </div>

              {isMyTurn && (
                <div className="turn-indicator">
                  ⬆️ Your Turn
                </div>
              )}
              {/* Play Again button appears when a game has ended */}
              {gameOverInfo && (
                <div style={{ marginTop: 12 }}>
                  <button type="button" className="btn-primary" onClick={handlePlayAgain}>
                    Play Again
                  </button>
                </div>
              )}
            </div>

            {statusMessage && (
                <div className={`status-message ${statusType}`} style={{ fontSize: '15px', padding: '14px 16px' }}>
                  {statusMessage}
                  {countdown !== null && (
                    <span style={{ marginLeft: 8 }}>
                      (bot in {countdown}s)
                    </span>
                  )}
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
                  winningPositions={winningPositions}
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
