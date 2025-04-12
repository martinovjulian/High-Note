// App.js
import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation
} from 'react-router-dom';
import axios from 'axios';
import CreateLobby from './components/CreateLobby';
import Lobby from './components/Lobby';
import './App.css';

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
          description: description
        }]);
      })
      .catch(error => console.error('Error creating lobby:', error));
  };

  return (
    <div className={isLobbyPage ? '' : 'App'}>
      {!isLobbyPage && (
        <>
          <CreateLobby onCreateLobby={addLobby} />
          <div className="lobby-list">
  {lobbies.map((lobby, index) => {
    const colors = [
      '#FFCDD2', '#F8BBD0', '#E1BEE7', '#D1C4E9',
      '#C5CAE9', '#BBDEFB', '#B2EBF2', '#C8E6C9',
      '#DCEDC8', '#FFF9C4', '#FFE0B2', '#FFCCBC'
    ];
    const bgColor = colors[index % colors.length]; // cycle through palette

    return (
      <Link key={lobby.lobby_id} to={`/lobby/${lobby.lobby_id}`} className="lobby-link">
        <div className="lobby-card" style={{ backgroundColor: bgColor }}>
          <h3>{lobby.lobby_name}</h3>
          <p className="lobby-description">{lobby.description || 'No description provided.'}</p>
          <p className="lobby-users">{lobby.user_count || 0} Active User(s)</p>
        </div>
      </Link>
    );
  })}
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
