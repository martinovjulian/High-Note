// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './components/Pages/LandingPage';
import Login from './components/Auth/Login';
import Hub from './components/Pages/Hub';
import Lobby from './components/System/Lobby'; // Import the Lobby component
import AnalysisPage from './components/Pages/AnalysisPage'; // Import the AnalysisPage component

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/app/*" element={<Hub />} />
          <Route path="/lobby/:lobbyId" element={<Lobby />} />
          {/* Route for the analysis page */}
          <Route path="/analysis" element={<AnalysisPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
