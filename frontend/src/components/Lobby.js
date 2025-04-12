// components/Lobby.js
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import NoteSubmitter from './NoteSubmitter';
import axios from 'axios';

function Lobby() {
  const { lobbyId } = useParams();
  const [lobbyDetails, setLobbyDetails] = useState(null);

  useEffect(() => {
    // Optionally fetch lobby details from backend
    axios.get(`http://localhost:8000/lobbies/${lobbyId}`)
      .then(response => setLobbyDetails(response.data))
      .catch(error => console.error("Failed to fetch lobby details:", error));
  }, [lobbyId]);

  return (
    <div className="lobby">
      <h2>{lobbyDetails ? lobbyDetails.lobby_name : `Lobby ID: ${lobbyId}`}</h2>
      <NoteSubmitter lobbyId={lobbyId} />
      <Link to="/">Back to Home</Link>
    </div>
  );
}

export default Lobby;
