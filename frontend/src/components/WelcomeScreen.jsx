import React, { useState } from 'react';

function WelcomeScreen({ onStart }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = username.trim();

    if (!trimmed) {
      setError('Please enter a username');
      return;
    }

    if (trimmed.length > 30) {
      setError('Username must be 30 characters or less');
      return;
    }

    setError('');
    onStart(trimmed);
  };

  const isDisabled = !username.trim();

  return (
    <div className="welcome-screen">
      <div className="welcome-container">
        <h1>Connect-4 Multiplayer</h1>
        <p className="subtitle">
          Play real-time with players or challenge a smart bot
        </p>

        <form onSubmit={handleSubmit} className="welcome-form">
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError('');
            }}
            maxLength="30"
            autoFocus
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={isDisabled}
          >
            Start Game
          </button>
        </form>

        {error && (
          <div className="status-message error" style={{ marginTop: '12px' }}>
            {error}
          </div>
        )}

        <div className="welcome-hint">
          ✨ No opponent found? Play against Bot
        </div>
      </div>
    </div>
  );
}

export default WelcomeScreen;
