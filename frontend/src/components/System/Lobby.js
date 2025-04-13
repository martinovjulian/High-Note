// src/components/System/Lobby.js
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import LobbyLayout from './LobbyLayout';
import NoteSubmitter from '../notes/NoteSubmitter';
import { useAuth } from '../../context/AuthContext';

function Lobby() {
  const { lobbyId } = useParams();
  const [lobbyDetails, setLobbyDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [password, setPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const { token } = useAuth();
  const navigate = useNavigate();

  // Advanced settings with separate concept counts for student and class, plus thresholds.
  const [advancedSettings, setAdvancedSettings] = useState({
    numConceptsStudent: 10,
    numConceptsClass: 15,
    similarityThresholdUpdate: 0.75,
    similarityThresholdAnalyze: 0.8,
  });

  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setAdvancedSettings((prev) => ({
      ...prev,
      [name]:
        name.includes("numConcepts")
          ? parseInt(value, 10)
          : parseFloat(value),
    }));
  };

  useEffect(() => {
    // Reset states on lobbyId or token change.
    setLobbyDetails(null);
    setErrorMessage('');
    setLoading(true);

    axios
      .get(`http://localhost:8000/lobby/lobbies/${lobbyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        console.log("Lobby details fetched:", response.data);
        setLobbyDetails(response.data);
      })
      .catch((error) => {
        console.error("Failed to fetch lobby details:", error);
        setErrorMessage(
          error.response?.data?.detail || 'Error loading lobby details'
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [lobbyId, token]);

  const handleDelete = () => {
    axios
      .delete(`http://localhost:8000/lobby/lobbies/${lobbyId}`, {
        data: { password },
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => navigate('/'))
      .catch((err) =>
        setDeleteError(err.response?.data?.detail || 'Deletion failed')
      );
  };

  return (
    <LobbyLayout>
      <div className="min-h-screen px-6 pt-12 pb-24 bg-gradient-to-br from-indigo-900 via-purple-800 to-fuchsia-900 text-white animate-fadeIn">
        <div className="max-w-4xl mx-auto text-center mb-12">
          {loading ? (
            <h2 className="text-4xl font-extrabold tracking-wide text-white drop-shadow-lg mb-2">
              Loading...
            </h2>
          ) : errorMessage ? (
            <h2 className="text-4xl font-extrabold tracking-wide text-red-400 drop-shadow-lg mb-2">
              {errorMessage}
            </h2>
          ) : (
            <h2 className="text-4xl font-extrabold tracking-wide text-white drop-shadow-lg mb-2">
              {lobbyDetails.lobby_name}
            </h2>
          )}
          <p className="text-purple-200 text-sm font-medium">
            Welcome to your personal note-taking lounge ✨
          </p>
        </div>

        {/* Render NoteSubmitter only when not loading and no error, using advanced settings:
            Prefer the lobby's advanced_settings if available; otherwise, fall back to local advancedSettings state */}
        {!loading && !errorMessage && (
          <NoteSubmitter
            lobbyId={lobbyId}
            advancedSettings={ (lobbyDetails && lobbyDetails.advanced_settings) || advancedSettings }
          />
        )}

        {/* Display the advanced settings for informational purposes */}
        {lobbyDetails && lobbyDetails.advanced_settings && (
          <div className="mt-10 bg-white/20 p-4 rounded-xl">
            <h3 className="text-xl font-bold mb-2">Lobby Advanced Settings</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="block text-sm font-medium">Student Concepts Count</span>
                <span className="text-lg font-bold">{lobbyDetails.advanced_settings.numConceptsStudent}</span>
              </div>
              <div>
                <span className="block text-sm font-medium">Class Concepts Count</span>
                <span className="text-lg font-bold">{lobbyDetails.advanced_settings.numConceptsClass}</span>
              </div>
              <div>
                <span className="block text-sm font-medium">Update Threshold</span>
                <span className="text-lg font-bold">{lobbyDetails.advanced_settings.similarityThresholdUpdate}</span>
              </div>
              <div>
                <span className="block text-sm font-medium">Analyze Threshold</span>
                <span className="text-lg font-bold">{lobbyDetails.advanced_settings.similarityThresholdAnalyze}</span>
              </div>
            </div>
          </div>
        )}

        {/* Lobby Deletion */}
        <div className="mt-10">
          <input
            type="password"
            placeholder="Enter password to delete lobby"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-4 py-2 rounded"
          />
          <button
            onClick={handleDelete}
            className="ml-2 bg-red-500 text-white px-4 py-2 rounded"
          >
            Delete Lobby
          </button>
          {deleteError && <div className="mt-2 text-red-400">{deleteError}</div>}
        </div>

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
