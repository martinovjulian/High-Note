import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation
} from 'react-router-dom';
import axios from 'axios';
import CreateLobby from './components/lobby/CreateLobby';
import Lobby from './components/lobby/Lobby';

function AppContent() {
  const location = useLocation();
  const isLobbyPage = location.pathname.startsWith('/lobby');

  const [lobbies, setLobbies] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:8000/lobbies')
      .then(response => setLobbies(response.data))
      .catch(error => console.error('Error fetching lobbies:', error));
  }, []);

  const addLobby = (lobbyName, description) => {
    axios.post('http://localhost:8000/create-lobby', {
      lobby_name: lobbyName,
      description: description,
      user_count: 0
    })
      .then(response => {
        setLobbies([...lobbies, {
          lobby_id: response.data.lobby_id,
          lobby_name: lobbyName,
          description: description,
          user_count: 0
        }]);
      })
      .catch(error => console.error('Error creating lobby:', error));
  };

  return (
    <div className={`${isLobbyPage ? '' : 'min-h-screen bg-gray-50'}`}>
      {!isLobbyPage && (
        <>
          <div className="py-8 px-4 max-w-5xl mx-auto">
            <CreateLobby onCreateLobby={addLobby} />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-10">
              {lobbies.map((lobby, index) => {
                const gradients = [
                  'from-pink-500 to-red-400',
                  'from-indigo-500 to-purple-500',
                  'from-blue-500 to-cyan-400',
                  'from-teal-500 to-green-400',
                  'from-yellow-400 to-orange-400',
                ];
                const gradient = gradients[index % gradients.length];

                return (
                  <Link
                    key={lobby.lobby_id}
                    to={`/lobby/${lobby.lobby_id}`}
                    className="transform hover:scale-105 transition-all duration-300"
                  >
                    <div
                      className={`rounded-xl shadow-xl p-6 bg-gradient-to-br ${gradient} text-white`}
                    >
                      <h3 className="text-xl font-semibold mb-2">{lobby.lobby_name}</h3>
                      <p className="text-sm mb-3 opacity-90">
                        {lobby.description || 'No description provided.'}
                      </p>
                      <div className="text-sm flex justify-between items-center font-medium">
                        <span>{lobby.user_count || 0} Active</span>
                        <span className="text-lg">🚀</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
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
