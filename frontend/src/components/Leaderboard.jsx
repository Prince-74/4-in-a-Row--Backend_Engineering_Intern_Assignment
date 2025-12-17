import React, { useEffect, useState } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

function Leaderboard() {
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch leaderboard from backend
    setLoading(true);
    fetch(`${BACKEND_URL}/leaderboard`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setPlayers(Array.isArray(data) ? data : []);
        setError('');
        setLoading(false);
      })
      .catch((err) => {
        setError(`Failed to load leaderboard: ${err.message}`);
        setPlayers([]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="leaderboard-container">
      <h2 className="leaderboard-title">🏆 Leaderboard</h2>

      {error && <div className="leaderboard-error">{error}</div>}

      {loading ? (
        <div className="leaderboard-empty">Loading leaderboard...</div>
      ) : players.length === 0 ? (
        <div className="leaderboard-empty">
          No players yet. Start playing to appear on the leaderboard!
        </div>
      ) : (
        <table className="leaderboard">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Wins</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, idx) => (
              <tr
                key={player.id}
                className={idx === 0 ? 'top-player' : ''}
              >
                <td className="rank">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                </td>
                <td>{player.username}</td>
                <td className="wins">{player.gamesWon}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Leaderboard;



