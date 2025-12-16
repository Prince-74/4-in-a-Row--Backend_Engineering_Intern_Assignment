import React, { useEffect, useState } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

function Leaderboard() {
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${BACKEND_URL}/leaderboard`)
      .then((res) => res.json())
      .then((data) => {
        setPlayers(data);
        setError('');
      })
      .catch(() => {
        setError('Failed to load leaderboard');
      });
  }, []);

  return (
    <div className="leaderboard">
      <h2>Leaderboard</h2>
      {error && <div className="error">{error}</div>}
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Username</th>
            <th>Wins</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, idx) => (
            <tr key={p.id}>
              <td>{idx + 1}</td>
              <td>{p.username}</td>
              <td>{p.gamesWon}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Leaderboard;


