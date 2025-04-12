// components/Lobby.js
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import NoteSubmitter from './NoteSubmitter';

function Lobby() {
  const { lobbyId } = useParams();

  return (
    <div className="lobby">
      <h2>Lobby ID: {lobbyId}</h2>
      {/* This is where your note submission functionality can reside */}
      <NoteSubmitter />
      <Link to="/">Back to Home</Link>
    </div>
  );
}

export default Lobby;
