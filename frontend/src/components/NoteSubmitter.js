// src/components/NoteSubmitter.js
import React, { useState } from 'react';

// Define the base URL of your FastAPI backend
const API_BASE_URL = 'http://localhost:8000';

function NoteSubmitter({ lobbyId }) {
  // State variables for user input (userId and note content)
  const [userId, setUserId] = useState('');
  const [content, setContent] = useState('');

  // States for feedback and loading
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    // Prepare the request body – note that class_id (lobbyId) is set automatically
    const requestBody = {
      user_id: userId,
      class_id: lobbyId,
      content: content,
    };

    console.log('--- DEBUG: Submitting Data ---');
    console.log('Request Body Object:', requestBody);
    console.log('Data Types:', {
      userId: typeof userId,
      lobbyId: typeof lobbyId,
      content: typeof content
    });
    console.log('-----------------------------');

    // Basic validation
    if (!userId || !lobbyId || !content) {
      setError('Please fill in all fields.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/submit-note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // Try parsing the response regardless of status
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

      // Success: clear user-input fields; lobbyId remains unchanged
      setMessage(`Note submitted successfully! ID: ${result.id}`);
      setUserId('');
      setContent('');

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
        {/* User ID Field */}
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

        {/* Auto-populated, non-editable Lobby ID Field */}
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

        {/* Note Content Field */}
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

        {/* Display Messages */}
        {message && <p style={styles.successMessage}>{message}</p>}
        {error && <p style={{ ...styles.errorMessage, fontWeight: 'bold' }}>{error}</p>}

        <button
          type="submit"
          style={styles.button}
          disabled={isLoading}
        >
          {isLoading ? 'Submitting...' : 'Submit Note'}
        </button>
      </form>
    </div>
  );
}

// Inline styles (consider using a CSS module or your own styling method)
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
