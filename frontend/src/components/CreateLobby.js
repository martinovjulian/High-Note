// components/CreateLobby.js
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
    <form onSubmit={handleSubmit}>
      <input 
        type="text" 
        placeholder="Enter lobby name" 
        value={lobbyName} 
        onChange={(e) => setLobbyName(e.target.value)}
      />
      <button type="submit">Create Lobby</button>
    </form>
  );
}

export default CreateLobby;
