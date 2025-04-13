// src/Pages/LandingPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-purple-900 to-indigo-900 text-white">
      <h1 className="text-4xl font-bold mb-6">Welcome to Our App</h1>
      <p className="mb-8">Discover and join exciting lobbies now!</p>
      <button 
        onClick={handleGetStarted}
        className="px-8 py-3 bg-indigo-600 rounded hover:bg-indigo-700">
        Get Started
      </button>
    </div>
  );
};

export default LandingPage;
