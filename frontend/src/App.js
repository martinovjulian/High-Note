// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import CreateLobby from './components/System/CreateLobby.js';
import Lobby from './components/System/Lobby.js';

function AppContent() {
  const location = useLocation();
  const isLobbyPage = location.pathname.startsWith('/lobby');
  const [lobbies, setLobbies] = useState([]);

  useEffect(() => {
    axios
      .get('http://localhost:8000/lobbies')
      .then((response) => setLobbies(response.data))
      .catch((error) => console.error('Error fetching lobbies:', error));
  }, []);

  const addLobby = (lobbyName, description) => {
    axios
      .post('http://localhost:8000/create-lobby', {
        lobby_name: lobbyName,
        description: description,
        user_count: 0,
      })
      .then(() => {
        // Refresh lobbies from DB to get the correct user_count
        axios
          .get('http://localhost:8000/lobbies')
          .then((response) => setLobbies(response.data))
          .catch((error) => console.error('Error re-fetching lobbies:', error));
      })
      .catch((error) => console.error('Error creating lobby:', error));
  };
  

  return (
    <div className={`${isLobbyPage ? '' : 'min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 text-white'}`}>
      {!isLobbyPage && (
        <div className="py-12 px-6 max-w-6xl mx-auto">
          <CreateLobby onCreateLobby={addLobby} />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-12">
            {lobbies.map((lobby, index) => {
              const gradients = [
                'from-fuchsia-600 to-pink-500',
                'from-indigo-600 to-purple-500',
                'from-cyan-500 to-blue-500',
                'from-lime-500 to-emerald-400',
                'from-yellow-400 to-orange-500',
              ];
              const gradient = gradients[index % gradients.length];

              return (
                <Link
                  key={lobby.lobby_id}
                  to={`/lobby/${lobby.lobby_id}`}
                  className="relative group transform transition duration-500 hover:scale-[1.03] animate-float"
                >
                  <div
                    className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 shadow-2xl backdrop-blur-md bg-opacity-80 border border-white/20 transition-all duration-300`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-2xl font-bold tracking-wide">{lobby.lobby_name}</h3>
                      <span className="inline-flex items-center px-2 py-1 text-sm font-semibold bg-green-500 text-white rounded-full animate-pulse shadow">
                        🟢 Online
                      </span>
                    </div>

                    <p className="text-sm text-white/90 mb-4">
                      {lobby.description || 'No description provided.'}
                    </p>

                    <div className="flex items-center gap-2 text-sm font-medium text-white/90">
  <span className="text-lg">👥</span>
  <span>{lobby.user_count || 0} Active Users</span>
</div>


                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
      <Routes>
        <Route path="/lobby/:lobbyId" element={<Lobby />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
