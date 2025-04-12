import React, { useState } from 'react';
import './CreateLobby.css';

function CreateLobby({ onCreateLobby }) {
  const [lobbyName, setLobbyName] = useState('');
  const [description, setDescription] = useState('');
  const [wordWarning, setWordWarning] = useState('');
  const [showModal, setShowModal] = useState(false);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (lobbyName.trim() && wordWarning === '') {
      onCreateLobby(lobbyName, description);
      setLobbyName('');
      setDescription('');
      setShowModal(false); // close modal on success
    }
  };

  return (
    <>
      <button className="open-modal-button" onClick={() => setShowModal(true)}>
        + Create Lobby
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Lobby</h2>
            <form className="lobby-form" onSubmit={handleSubmit}>
              <input
                className="lobby-input"
                type="text"
                placeholder="Lobby name"
                value={lobbyName}
                onChange={(e) => setLobbyName(e.target.value)}
              />

              <textarea
                className="lobby-textarea"
                placeholder="Description (max 50 words)"
                value={description}
                onChange={handleDescriptionChange}
              />
              {wordWarning && (
                <p style={{ color: 'red', fontSize: '0.85em' }}>{wordWarning}</p>
              )}

              <div className="modal-actions">
                <button
                  className="lobby-button"
                  type="submit"
                  disabled={!!wordWarning}
                >
                  Create
                </button>
                <button
                  className="cancel-button"
                  type="button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
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
