// src/components/CreateLobby.js
import React, { useState } from 'react';

function CreateLobby({ onCreateLobby }) {
  const [lobbyName, setLobbyName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (lobbyName.trim()) {
      onCreateLobby(lobbyName);
      setLobbyName('');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <input
        type="text"
        value={lobbyName}
        onChange={(e) => setLobbyName(e.target.value)}
        placeholder="Enter Lobby Name"
        required
        style={styles.input}
      />
      <button type="submit" style={styles.button}>
        Create Lobby
      </button>
    </form>
  );
}

const styles = {
  form: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
    justifyContent: 'center',
  },
  input: {
    padding: '8px',
    border: '1px solid #ccc',
    borderRadius: '4px',
  },
  button: {
    padding: '8px 12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default CreateLobby;
