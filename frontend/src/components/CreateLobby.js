// components/CreateLobby.js
import React, { useState } from 'react';
import './CreateLobby.css';

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
    <form className="lobby-form" onSubmit={handleSubmit}>
      <input 
        className="lobby-input"
        type="text" 
        placeholder="Enter lobby name" 
        value={lobbyName} 
        onChange={(e) => setLobbyName(e.target.value)}
      />
      <button className="lobby-button" type="submit">Create Lobby</button>
    </form>
  );
}

export default CreateLobby;