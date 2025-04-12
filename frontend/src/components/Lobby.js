import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import NoteSubmitter from './NoteSubmitter';
import axios from 'axios';
import LobbyLayout from './LobbyLayout'; // ✅ Import it

function Lobby() {
  const { lobbyId } = useParams();
  const [lobbyDetails, setLobbyDetails] = useState(null);

  useEffect(() => {
    setLobbyDetails(null); // Clear old data while fetching
    axios.get(`http://localhost:8000/lobbies/${lobbyId}`)
      .then(response => setLobbyDetails(response.data))
      .catch(error => console.error("Failed to fetch lobby details:", error));
  }, [lobbyId]);

  return (
    <LobbyLayout>
      <h2>{lobbyDetails ? lobbyDetails.lobby_name : `Lobby ID: ${lobbyId}`}</h2>
      <NoteSubmitter lobbyId={lobbyId} />
      <Link to="/">Back to Home</Link>
    </LobbyLayout>
  );
}

export default Lobby;
