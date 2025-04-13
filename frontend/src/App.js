// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './components/Pages/LandingPage';
import Login from './components/Auth/Login';
import Hub from './components/Pages/Hub';
import Lobby from './components/System/Lobby';
import AnalysisPage from './components/Pages/AnalysisPage';
import MainLayout from './components/Layout/MainLayout';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Routes without the home button */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />

          {/* Routes with the home button */}
          <Route element={<MainLayout />}>
            <Route path="/app/*" element={<Hub />} />
            <Route path="/lobby/:lobbyId" element={<Lobby />} />
            <Route path="/analysis" element={<AnalysisPage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
