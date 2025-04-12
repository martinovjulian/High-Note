// src/components/NoteSubmitter.js
import React, { useState } from 'react';

const API_BASE_URL = 'http://localhost:8000';

function NoteSubmitter({ lobbyId }) {
  const [userId, setUserId] = useState('');
  const [content, setContent] = useState('');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    const requestBody = {
      user_id: userId,
      class_id: lobbyId,
      content: content,
    };

    // Basic validation
    if (!userId || !lobbyId || !content) {
      setError('Please fill in all fields.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/submit-note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      let result = {};
      try {
        result = await response.json();
      } catch (parseError) {
        console.error("Could not parse response JSON:", parseError);
        if (response.ok) {
          setMessage('Note submitted (but response format was unexpected).');
          setUserId('');
          setContent('');
          return;
        }
        throw new Error(`HTTP error! Status: ${response.status}. Response not valid JSON.`);
      }

      if (!response.ok) {
        let errorDetail = `HTTP error! Status: ${response.status}`;
        if (result && result.detail) {
          if (typeof result.detail === 'string') {
            errorDetail = result.detail;
          } else if (Array.isArray(result.detail)) {
            errorDetail = result.detail.map(err => `${err.loc ? err.loc.join('.') : 'error'}: ${err.msg}`).join('; ');
          } else {
            errorDetail = JSON.stringify(result.detail);
          }
        }
        console.error('Server Error Response:', result);
        throw new Error(errorDetail);
      }

      setMessage(`Note submitted successfully! ID: ${result.id}`);
      setUserId('');
      setContent('');

      // Optional: increment user count in lobby
      const incrementResponse = await fetch(`${API_BASE_URL}/lobbies/${lobbyId}/increment-user-count`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!incrementResponse.ok) {
        const incrementError = await incrementResponse.json();
        console.error('Increment user count failed:', incrementError);
        setError('Note submitted, but failed to increment lobby count.');
      }
    } catch (err) {
      console.error("Submission failed:", err);
      setError(err.message || 'Failed to submit note. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Submit a New Note</h2>
      <p style={{ fontSize: '0.9em', color: '#555' }}>
        Fill in the details and click submit. Check the browser's developer console (F12) for debugging logs.
      </p>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label htmlFor="userId" style={styles.label}>User ID:</label>
          <input
            type="text"
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={styles.input}
            disabled={isLoading}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="classId" style={styles.label}>Lobby ID:</label>
          <input
            type="text"
            id="classId"
            value={lobbyId}
            readOnly
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="content" style={styles.label}>Note Content:</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={styles.textarea}
            rows="6"
            disabled={isLoading}
            required
          />
        </div>

        {message && <p style={styles.successMessage}>{message}</p>}
        {error && <p style={{ ...styles.errorMessage, fontWeight: 'bold' }}>{error}</p>}

        <button type="submit" style={styles.button} disabled={isLoading}>
          {isLoading ? 'Submitting...' : 'Submit Note'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '500px',
    margin: '20px auto',
    padding: '20px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    fontFamily: 'Arial, sans-serif',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '5px',
    fontWeight: 'bold',
  },
  input: {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '1rem',
  },
  textarea: {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '1rem',
    minHeight: '100px',
    resize: 'vertical',
  },
  button: {
    padding: '10px 15px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  successMessage: {
    color: 'green',
    marginTop: '10px',
    textAlign: 'center',
    border: '1px solid green',
    padding: '8px',
    borderRadius: '4px',
    backgroundColor: '#e6ffed',
  },
  errorMessage: {
    color: 'red',
    marginTop: '10px',
    textAlign: 'center',
    border: '1px solid red',
    padding: '8px',
    borderRadius: '4px',
    backgroundColor: '#ffe6e6',
  },
};

export default NoteSubmitter;
