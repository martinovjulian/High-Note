// App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import NoteSubmitter from './components/NoteSubmitter';
import CreateLobby from './components/CreateLobby';
import Lobby from './components/Lobby';
import './App.css';

function App() {
  const [lobbies, setLobbies] = useState([]);

  // Callback to add a new lobby to the list
  const addLobby = (lobbyName) => {
    const newLobby = { id: Date.now(), name: lobbyName };
    setLobbies([...lobbies, newLobby]);
  };

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>My Notes App</h1>
          <nav>
            <Link to="/">Home</Link>
          </nav>
        </header>
        <main>
          <Routes>
            <Route
              path="/"
              element={
                <>
                  {/* CreateLobby component provides the form for new lobbies */}
                  <CreateLobby onCreateLobby={addLobby} />
                  {/* List existing lobbies as clickable links */}
                  <ul>
                    {lobbies.map(lobby => (
                      <li key={lobby.id}>
                        <Link to={`/lobby/${lobby.id}`}>{lobby.name}</Link>
                      </li>
                    ))}
                  </ul>
                </>
              }
            />
            {/* Dynamic lobby page, the lobby page receives the lobby id as a URL parameter */}
            <Route path="/lobby/:lobbyId" element={<Lobby />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
