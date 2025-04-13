import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CreateLobby from '../System/CreateLobby';
import Lobby from '../System/Lobby';
import AnalysisPage from './AnalysisPage';
import { useAuth } from '../../context/AuthContext';

const Hub = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();
  const isLobbyPage = location.pathname.startsWith('/lobby');
  const isAnalysisPage = location.pathname.startsWith('/analysis');
  const [lobbies, setLobbies] = useState([]);
  
  // State for the password modal and lobby selection
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedLobby, setSelectedLobby] = useState(null);
  const [enteredPassword, setEnteredPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      setIsLoading(true);
      axios
        .get('http://localhost:8000/lobby/lobbies', {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((response) => {
          setLobbies(response.data);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching lobbies:', error);
          setIsLoading(false);
        });
    }
  }, [token]);

  const addLobby = (lobbyName, description, password, advancedSettings) => {
    setIsLoading(true);
    axios
      .post(
        'http://localhost:8000/lobby/create-lobby',
        {
          lobby_name: lobbyName,
          description: description,
          user_count: 0,
          password: password,
          advanced_settings: advancedSettings
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      .then(() => {
        return axios.get('http://localhost:8000/lobby/lobbies', {
          headers: { Authorization: `Bearer ${token}` }
        });
      })
      .then((response) => {
        setLobbies(response.data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error creating lobby:', error);
        setIsLoading(false);
      });
  };

  if (!token) {
    navigate('/login');
    return null;
  }

  const handleLobbyClick = async (lobby) => {
    try {
      const res = await axios.get(`http://localhost:8000/lobby/lobbies/${lobby.lobby_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fullLobby = res.data;
      if (!fullLobby.password) {
        navigate(`/lobby/${lobby.lobby_id}`);
        return;
      }
      setSelectedLobby(fullLobby);
      setShowPasswordModal(true);
    } catch (error) {
      console.error("Error fetching lobby:", error);
      alert("⚠️ Failed to validate lobby access.");
    }
  };

  const handlePasswordSubmit = () => {
    if (enteredPassword === selectedLobby.password) {
      navigate(`/lobby/${selectedLobby.lobby_id}`);
    } else {
      alert("❌ Incorrect password.");
    }
    setShowPasswordModal(false);
    setEnteredPassword('');
    setSelectedLobby(null);
  };

  return (
    <div className={`${isLobbyPage || isAnalysisPage ? '' : 'min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 text-white'}`}>
      {!isLobbyPage && !isAnalysisPage && (
        <>
          <div className="py-12 px-6 max-w-6xl mx-auto">
            <div className="mb-12 text-center">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent mb-4">
                High Note
              </h1>
              <p className="text-xl text-purple-200">
                Elevate your study sessions with collaborative learning
              </p>
            </div>

            <div className="mb-12">
              <CreateLobby onCreateLobby={addLobby} />
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-12">
                {lobbies.map((lobby) => (
                  <div
                    key={lobby.lobby_id}
                    onClick={() => handleLobbyClick(lobby)}
                    className="cursor-pointer relative group transform transition duration-500 hover:scale-[1.03] animate-float"
                  >
                    <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl p-6 shadow-xl backdrop-blur-md border border-purple-100 transition-all duration-300 hover:border-purple-300 hover:shadow-2xl">
                      {/* Lobby Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-2xl font-bold tracking-wide text-purple-900">{lobby.lobby_name}</h3>
                          {lobby.password && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-700 rounded-full border border-purple-200">
                              🔒 Private
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-600 mb-6 line-clamp-2">
                        {lobby.description || 'No description provided.'}
                      </p>

                      {/* Lobby Stats */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-purple-100">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center border border-purple-200">
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </div>
                          <div>
                          <p className="text-xs text-gray-500">Notes</p>
                            <p className="text-sm font-medium text-purple-700">{lobby.user_count || 0}</p>
                          </div>
                        </div>
                       
                      </div>

                      {/* Join Button */}
                      <div className="mt-4">
                        <button className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 group-hover:scale-105">
                          <span>Join Session</span>
                          <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Enhanced Password Modal */}
          {showPasswordModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
              <div className="bg-gradient-to-br from-purple-800/90 to-indigo-900/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-96 transform transition-all duration-300 animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-white">Enter Session Password</h3>
                  <button
                    onClick={() => {
                      setShowPasswordModal(false);
                      setEnteredPassword('');
                      setSelectedLobby(null);
                    }}
                    className="text-white/70 hover:text-white transition-colors duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <input 
                    type="password"
                    value={enteredPassword}
                    onChange={(e) => setEnteredPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  />
                  <button 
                    onClick={handlePasswordSubmit}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                  >
                    Join Session
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <Routes>
        <Route path="/lobby/:lobbyId" element={<Lobby />} />
        <Route path="/analysis" element={<AnalysisPage />} />
      </Routes>
    </div>
  );
};

export default Hub;
