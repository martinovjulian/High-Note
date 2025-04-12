// App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import CreateLobby from './components/CreateLobby';
import Lobby from './components/Lobby';
import './App.css';

function App() {
  const [lobbies, setLobbies] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:8000/lobbies')
      .then(response => setLobbies(response.data))
      .catch(error => console.error('Error fetching lobbies:', error));
  }, []);

  const addLobby = (lobbyName) => {
    axios.post('http://localhost:8000/create-lobby', { lobby_name: lobbyName })
      .then(response => {
        setLobbies([...lobbies, { lobby_id: response.data.lobby_id, lobby_name: lobbyName }]);
      })
      .catch(error => console.error('Error creating lobby:', error));
  };

  return (
    <Router>
      <div className="App">
        <CreateLobby onCreateLobby={addLobby} />
        <div className="lobby-list">
          {lobbies.map(lobby => (
            <Link key={lobby.lobby_id} to={`/lobby/${lobby.lobby_id}`} className="lobby-link">
              <div className="lobby-card">
                {lobby.lobby_name}
              </div>
            </Link>
          ))}
        </div>
        <Routes>
          <Route path="/lobby/:lobbyId" element={<Lobby />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;