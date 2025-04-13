// src/components/System/Lobby.js
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import LobbyLayout from './LobbyLayout';
import NoteSubmitter from '../notes/NoteSubmitter';
import { useAuth } from '../../context/AuthContext';

function Lobby() {
  const { lobbyId } = useParams();
  const navigate = useNavigate();
  const { token, username } = useAuth();

  const [lobbyDetails, setLobbyDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isCreator, setIsCreator] = useState(false);

  // States for Settings Modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  // For editing settings, if lobbyDetails contains advanced_settings then initialize from it
  const [editedSettings, setEditedSettings] = useState({
    numConceptsStudent: 10,
    numConceptsClass: 15,
    similarityThresholdUpdate: 0.75,
    similarityThresholdAnalyze: 0.8,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // State for delete functionality
  const [password, setPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Add new state for tab management
  const [activeTab, setActiveTab] = useState('general');

  // Fetch lobby details and initialize settings
  useEffect(() => {
    setLobbyDetails(null);
    setErrorMessage('');
    setLoading(true);

    axios
      .get(`http://localhost:8000/lobby/lobbies/${lobbyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setLobbyDetails(response.data);
        // Check if current user is the creator
        setIsCreator(response.data.created_by === username);
        // Initialize the settings to the advanced_settings if available.
        if (response.data?.advanced_settings) {
          setEditedSettings({ ...response.data.advanced_settings });
        }
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
  }, [lobbyId, token, username]);

  const handleSettingsClick = () => {
    // Reset edited settings to current lobby details (if any) when opening the modal
    if (lobbyDetails?.advanced_settings) {
      setEditedSettings({ ...lobbyDetails.advanced_settings });
    }
    // Clear any previous errors
    setDeleteError('');
    setSaveError('');
    setShowSettingsModal(true);
  };

  const handleSettingsChange = (e) => {
    if (!isCreator) return; // Prevent changes if not creator
    const { name, value } = e.target;
    setEditedSettings((prev) => ({
      ...prev,
      [name]: name.includes("numConcepts") ? parseInt(value, 10) : parseFloat(value),
    }));
  };

  const handleSaveSettings = async () => {
    if (!editedSettings || !isCreator) return;

    setIsSaving(true);
    setSaveError('');

    try {
      await axios.put(
        `http://localhost:8000/lobby/lobbies/${lobbyId}/update-settings`,
        { advanced_settings: editedSettings },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local lobby details with the new advanced settings
      setLobbyDetails((prev) => ({
        ...prev,
        advanced_settings: { ...editedSettings }
      }));

      setShowSettingsModal(false);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setSaveError(error.response?.data?.detail || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    // Require a password before deletion
    if (!password.trim()) {
      setDeleteError('Password is required to delete the lobby');
      return;
    }

    axios
      .delete(`http://localhost:8000/lobby/lobbies/${lobbyId}`, {
        data: { password },
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        setShowSettingsModal(false);
        navigate('/');
      })
      .catch((err) =>
        setDeleteError(err.response?.data?.detail || 'Deletion failed')
      );
  };

  return (
    <LobbyLayout>
      <div className="min-h-screen px-6 pt-12 pb-24 bg-gradient-to-br from-indigo-900 via-purple-800 to-fuchsia-900 text-white animate-fadeIn">
        <div className="max-w-4xl mx-auto relative">
          {/* Header with Settings Icon - Only show for creator */}
          {isCreator && (
            <div className="absolute -top-4 -right-4 z-10">
              <button 
                onClick={handleSettingsClick}
                className="bg-white/40 p-4 rounded-xl hover:bg-white/60 active:bg-purple-500/60 transition-all duration-200 shadow-xl hover:shadow-purple-500/40 w-16 h-16 flex items-center justify-center border-2 border-white/30"
                title="Lobby Settings"
                aria-label="Open Settings Menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          )}
          
          <div className="text-center mb-12">
            {loading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                <h2 className="text-4xl font-extrabold tracking-wide text-white drop-shadow-lg">
                  Loading...
                </h2>
              </div>
            ) : errorMessage ? (
              <div className="bg-red-500/20 border border-red-500 p-6 rounded-xl">
                <h2 className="text-4xl font-extrabold tracking-wide text-red-400 drop-shadow-lg mb-2">
                  {errorMessage}
                </h2>
                <p className="text-red-300">Please try refreshing the page or contact support if the issue persists.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <h2 className="text-5xl font-extrabold tracking-wide text-white drop-shadow-lg mb-2">
                    {lobbyDetails.lobby_name}
                  </h2>
                  {lobbyDetails.created_by && (
                    <p className="text-purple-300 text-sm font-medium mb-1">
                      Created by: {lobbyDetails.created_by} {isCreator && (
                        <span className="bg-purple-500/30 px-2 py-0.5 rounded-full text-xs ml-1">
                          You
                        </span>
                      )}
                    </p>
                  )}
                </div>
                
                {/* Lobby Description */}
                {lobbyDetails.description && (
                  <div className="max-w-2xl mx-auto mt-6 p-6 bg-white/10 rounded-xl backdrop-blur-sm border border-purple-400/30">
                    <h3 className="text-lg font-semibold text-purple-200 mb-2">About this Lobby</h3>
                    <p className="text-purple-100 leading-relaxed">
                      {lobbyDetails.description}
                    </p>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>

        {/* Pass advanced settings to the NoteSubmitter – either from lobbyDetails if available or fallback */}
        {!loading && !errorMessage && (
          <NoteSubmitter
            lobbyId={lobbyId}
            advancedSettings={(lobbyDetails && lobbyDetails.advanced_settings) || editedSettings}
          />
        )}

        {/* Settings Modal */}
        {showSettingsModal && lobbyDetails && editedSettings && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] backdrop-blur-sm animate-fadeIn"
            onClick={() => setShowSettingsModal(false)}
          >
            <div
              className="bg-gradient-to-br from-purple-900/90 to-indigo-900/90 backdrop-blur-xl border border-purple-500/30 rounded-xl shadow-2xl p-6 w-full max-w-md transform animate-popIn max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6 border-b border-purple-400/30 pb-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold text-white">Lobby Settings</h3>
                  {isCreator && (
                    <span className="bg-purple-500/30 px-2 py-0.5 rounded-full text-xs font-medium text-purple-200">
                      Creator
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="text-white bg-purple-700/50 hover:bg-purple-700/80 p-2 rounded-lg transition-colors w-10 h-10 flex items-center justify-center"
                  aria-label="Close settings modal"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'general'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/10 text-purple-200 hover:bg-white/20'
                  }`}
                >
                  General
                </button>
                <button
                  onClick={() => setActiveTab('advanced')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'advanced'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/10 text-purple-200 hover:bg-white/20'
                  }`}
                >
                  Advanced
                </button>
                {isCreator && (
                  <button
                    onClick={() => setActiveTab('danger')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === 'danger'
                        ? 'bg-red-600 text-white'
                        : 'bg-white/10 text-red-200 hover:bg-white/20'
                    }`}
                  >
                    Delete
                  </button>
                )}
              </div>

              {/* Tab Content */}
              <div className="space-y-4">
                {/* General Settings Tab */}
                {activeTab === 'general' && (
                  <div className="space-y-4">
                    <div className="bg-white/10 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-white mb-2">Lobby Information</h4>
                      <div className="space-y-2">
                        <p className="text-purple-200">
                          <span className="font-medium">Name:</span> {lobbyDetails.lobby_name}
                        </p>
                        <p className="text-purple-200">
                          <span className="font-medium">Created by:</span> {lobbyDetails.created_by}
                        </p>
                        {lobbyDetails.description && (
                          <p className="text-purple-200">
                            <span className="font-medium">Description:</span> {lobbyDetails.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Advanced Settings Tab */}
                {activeTab === 'advanced' && (
                  <div className="space-y-4">
                    <div className="bg-white/10 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-white mb-4">Concept Settings</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-purple-200 mb-1">
                            Student Concepts
                          </label>
                          <input
                            type="number"
                            name="numConceptsStudent"
                            value={editedSettings.numConceptsStudent}
                            onChange={handleSettingsChange}
                            disabled={!isCreator}
                            className={`w-full bg-white/20 border border-purple-400/30 rounded-lg p-2 text-white font-bold ${
                              !isCreator ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                            min="1"
                            max="50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-purple-200 mb-1">
                            Class Concepts
                          </label>
                          <input
                            type="number"
                            name="numConceptsClass"
                            value={editedSettings.numConceptsClass}
                            onChange={handleSettingsChange}
                            disabled={!isCreator}
                            className={`w-full bg-white/20 border border-purple-400/30 rounded-lg p-2 text-white font-bold ${
                              !isCreator ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                            min="1"
                            max="50"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/10 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-white mb-4">Similarity Thresholds</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-purple-200 mb-1">
                            Update Threshold
                          </label>
                          <input
                            type="number"
                            step="0.05"
                            name="similarityThresholdUpdate"
                            value={editedSettings.similarityThresholdUpdate}
                            onChange={handleSettingsChange}
                            disabled={!isCreator}
                            className={`w-full bg-white/20 border border-purple-400/30 rounded-lg p-2 text-white font-bold ${
                              !isCreator ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                            min="0"
                            max="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-purple-200 mb-1">
                            Analyze Threshold
                          </label>
                          <input
                            type="number"
                            step="0.05"
                            name="similarityThresholdAnalyze"
                            value={editedSettings.similarityThresholdAnalyze}
                            onChange={handleSettingsChange}
                            disabled={!isCreator}
                            className={`w-full bg-white/20 border border-purple-400/30 rounded-lg p-2 text-white font-bold ${
                              !isCreator ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                            min="0"
                            max="1"
                          />
                        </div>
                      </div>
                    </div>

                    {isCreator && (
                      <button
                        onClick={handleSaveSettings}
                        disabled={isSaving}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold rounded-lg shadow-lg transition-all hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? (
                          <div className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </div>
                        ) : 'Save Changes'}
                      </button>
                    )}
                  </div>
                )}

                {/* Danger Zone Tab */}
                {activeTab === 'danger' && isCreator && (
                  <div className="space-y-4">
                    <div className="bg-red-900/20 p-4 rounded-lg border border-red-500/30">
                      <h4 className="text-lg font-semibold text-white mb-4">Delete Lobby</h4>
                      <p className="text-red-200 text-sm mb-4">
                        This action cannot be undone. All notes and data associated with this lobby will be permanently deleted.
                      </p>
                      <input
                        type="password"
                        placeholder="Enter password to delete lobby"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full mb-3 p-3 bg-black/30 border border-red-500/40 rounded-lg text-white"
                      />
                      {deleteError && (
                        <div className="mb-3 text-red-300 text-sm">
                          {deleteError}
                        </div>
                      )}
                      <button
                        onClick={handleDelete}
                        className="w-full py-3 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-bold rounded-lg shadow-lg transition-all hover:shadow-red-500/30 flex items-center justify-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Lobby
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="text-center mt-12">
        </div>
      </div>
    </LobbyLayout>
  );
}

export default Lobby;
