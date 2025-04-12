import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import NoteSubmitter from '../notes/NoteSubmitter';
import axios from 'axios';
import LobbyLayout from './LobbyLayout';

function Lobby() {
  const { lobbyId } = useParams();
  const [lobbyDetails, setLobbyDetails] = useState(null);

  useEffect(() => {
    setLobbyDetails(null);
    axios.get(`http://localhost:8000/lobbies/${lobbyId}`)
      .then(response => setLobbyDetails(response.data))
      .catch(error => console.error("Failed to fetch lobby details:", error));
  }, [lobbyId]);

  return (
    <LobbyLayout>
      <div className="min-h-screen px-6 pt-12 pb-24 bg-gradient-to-br from-indigo-900 via-purple-800 to-fuchsia-900 text-white animate-fadeIn">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-4xl font-extrabold tracking-wide text-white drop-shadow-lg mb-2">
            {lobbyDetails ? lobbyDetails.lobby_name : `Lobby ID: ${lobbyId}`}
          </h2>
          <p className="text-purple-200 text-sm font-medium">
            Welcome to your personal note-taking lounge ✨
          </p>
        </div>

        <NoteSubmitter lobbyId={lobbyId} />

        <div className="text-center mt-12">
          <Link
            to="/"
            className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 hover:from-purple-600 hover:to-pink-500 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:shadow-pink-400/40 transition transform hover:scale-105"
          >
            ⬅ Back to Home
          </Link>
        </div>
      </div>
    </LobbyLayout>
  );
}

export default Lobby;
