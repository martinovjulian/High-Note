// src/components/System/CreateLobby.js
import React, { useState } from 'react';

function CreateLobby({ onCreateLobby }) {
  const [lobbyName, setLobbyName] = useState('');
  const [description, setDescription] = useState('');
  const [wordWarning, setWordWarning] = useState('');
  const [showModal, setShowModal] = useState(false);
  // Added state for password
  const [password, setPassword] = useState('');
  // Added state for advanced settings
  const [advancedSettings, setAdvancedSettings] = useState({
    numConceptsStudent: 10,
    numConceptsClass: 15,
    similarityThresholdUpdate: 0.75,
    similarityThresholdAnalyze: 0.8,
  });

  const handleDescriptionChange = (e) => {
    const input = e.target.value;
    const wordCount = input.trim().split(/\s+/).length;

    if (wordCount > 50) {
      setWordWarning('Description must be 50 words or less.');
    } else {
      setWordWarning('');
    }
    setDescription(input);
  };

  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setAdvancedSettings((prev) => ({
      ...prev,
      [name]:
        name.includes("numConcepts")
          ? parseInt(value, 10)
          : parseFloat(value),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (lobbyName.trim() && wordWarning === '') {
      onCreateLobby(lobbyName, description, password, advancedSettings); // Passing advanced settings too
      setLobbyName('');
      setDescription('');
      setPassword(''); // Reset the password field
      setShowModal(false);
    }
  };

  return (
    <>
      <button
        className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold px-4 py-2 rounded-lg shadow hover:shadow-purple-500/50"
        onClick={() => setShowModal(true)}
      >
        <span className="flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Create Session</span>
        </span>
      </button>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md border border-purple-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Create New Session
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Session Name</label>
                <input
                  type="text"
                  placeholder="Enter session name"
                  value={lobbyName}
                  onChange={(e) => setLobbyName(e.target.value)}
                  required
                  className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Description (max 50 words)</label>
                <textarea
                  placeholder="Describe your session"
                  value={description}
                  onChange={handleDescriptionChange}
                  className="w-full p-3 bg-white border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-200"
                  rows="3"
                />
                {wordWarning && (
                  <p className="text-red-500 text-sm">{wordWarning}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Password (optional)</label>
                <input
                  type="password"
                  placeholder="Set a password for private access"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-200"
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700">Advanced Settings</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">Key Concepts</label>
                      <div className="group relative">
                        <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block">
                          <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                            Amount of concepts to derive and analyze from your notes
                          </div>
                        </div>
                      </div>
                    </div>
                    <input
                      type="number"
                      name="numConceptsStudent"
                      value={advancedSettings.numConceptsStudent}
                      onChange={handleSettingsChange}
                      className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">Other Students Concepts</label>
                      <div className="group relative">
                        <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block">
                          <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                            Number of concepts to derive from other students to analzye against your notes
                          </div>
                        </div>
                      </div>
                    </div>
                    <input
                      type="number"
                      name="numConceptsClass"
                      value={advancedSettings.numConceptsClass}
                      onChange={handleSettingsChange}
                      className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">Similarity Threshold</label>
                      <div className="group relative">
                        <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block">
                          <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                          Sets how closely two phrases must match to be considered the same concept.
                          Higher values require stronger overlap or exact wording 
                          </div>
                        </div>
                      </div>
                    </div>
                    <input
                      type="number"
                      step="0.05"
                      name="similarityThresholdUpdate"
                      value={advancedSettings.similarityThresholdUpdate}
                      onChange={handleSettingsChange}
                      className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">Concept Similarity Threshold</label>
                      <div className="group relative">
                        <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block">
                          <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                          Controls how closely two ideas must match to be considered the same topic.
                          Higher values require stronger similarity (e.g., exact phrases or very closely related terms).
                          </div>
                        </div>
                      </div>
                    </div>
                    <input
                      type="number"
                      step="0.05"
                      name="similarityThresholdAnalyze"
                      value={advancedSettings.similarityThresholdAnalyze}
                      onChange={handleSettingsChange}
                      className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-all duration-200 border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!!wordWarning}
                  className={`px-5 py-2 rounded-lg font-semibold transition-all duration-200 ${
                    wordWarning
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50'
                  }`}
                >
                  Create Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default CreateLobby;
