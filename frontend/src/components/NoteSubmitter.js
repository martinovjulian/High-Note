import React, { useState } from 'react';

// Define the base URL of your FastAPI backend
const API_BASE_URL = 'http://localhost:8000'; // <-- Adjust if your backend runs on a different port

function NoteSubmitter() {
  // State variables to hold the input values
  const [userId, setUserId] = useState('');
  const [classId, setClassId] = useState('');
  const [content, setContent] = useState('');

  // State variables for handling feedback and loading status
  const [message, setMessage] = useState(''); // For success messages
  const [error, setError] = useState('');     // For error messages
  const [isLoading, setIsLoading] = useState(false); // To disable button during submission

  // Function to handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default form submission behavior

    setIsLoading(true); // Disable button
    setError('');       // Clear previous errors
    setMessage('');     // Clear previous messages

    // --- Debugging Step 1 & 2: Log data and types before sending ---
    const requestBody = {
      user_id: userId,
      class_id: classId,
      content: content,
    };
    console.log('--- DEBUG: Submitting Data ---');
    console.log('Request Body Object:', requestBody);
    console.log('Data Types:', {
        userId: typeof userId,
        classId: typeof classId,
        content: typeof content
    });
    console.log('-----------------------------');
    // --- End Debugging Step ---

    // Basic validation (still useful)
    if (!userId || !classId || !content) {
      setError('Please fill in all fields.');
      setIsLoading(false); // Re-enable button on validation failure
      return;
    }


    try {
      const response = await fetch(`${API_BASE_URL}/submit-note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add any other headers if required (e.g., Authorization)
        },
        body: JSON.stringify(requestBody), // Use the object we logged
      });

      // Try to parse response body regardless of status, as errors might have details
      let result = {};
      try {
        result = await response.json();
      } catch (parseError) {
         // Handle cases where the response is not JSON (e.g., unexpected server error HTML page)
         console.error("Could not parse response JSON:", parseError);
         // If the status was otherwise ok, maybe it was an unexpected success response format
         if (response.ok) {
             setMessage('Note submitted (but response format was unexpected).');
             // Optionally clear form
             setUserId(''); setClassId(''); setContent('');
             return; // Exit cleanly
         }
         // If status was not ok and couldn't parse, throw a generic error
         throw new Error(`HTTP error! Status: ${response.status}. Response not valid JSON.`);
      }


      if (!response.ok) {
        // Handle HTTP errors (e.g., 4xx, 5xx)
        // --- Debugging Step 3: Improve error message extraction ---
        // FastAPI 422 errors often have details in `result.detail`
        // It might be a string or an array of error objects
        let errorDetail = `HTTP error! Status: ${response.status}`;
        if (result && result.detail) {
            if (typeof result.detail === 'string') {
                errorDetail = result.detail;
            } else if (Array.isArray(result.detail)) {
                // Format array of validation errors
                errorDetail = result.detail.map(err => `${err.loc ? err.loc.join('.') : 'error'}: ${err.msg}`).join('; ');
            } else {
                // Fallback if detail is an unexpected format
                 errorDetail = JSON.stringify(result.detail);
            }
        }
        console.error('Server Error Response:', result); // Log the full error object from server
        throw new Error(errorDetail);
        // --- End Debugging Step 3 ---
      }

      // Success!
      setMessage(`Note submitted successfully! ID: ${result.id}`);
      // Optionally clear the form fields after successful submission
      setUserId('');
      setClassId('');
      setContent('');

    } catch (err) {
      // Handle network errors or errors thrown above
      console.error("Submission failed:", err);
      // Display the specific error message we crafted or the generic one
      setError(err.message || 'Failed to submit note. Check console for details.');
    } finally {
      setIsLoading(false); // Re-enable button
    }
  };

  return (
    <div style={styles.container}>
      <h2>Submit a New Note</h2>
       {/* Instructions for user */}
       <p style={{ fontSize: '0.9em', color: '#555' }}>
          Fill in the details and click submit. Check the browser's developer console (F12) for debugging logs.
       </p>
      <form onSubmit={handleSubmit} style={styles.form}>
        {/* ... (Input fields remain the same as before) ... */}
         <div style={styles.formGroup}>
          <label htmlFor="userId" style={styles.label}>User ID:</label>
          <input
            type="text"
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={styles.input}
            disabled={isLoading}
            required // HTML5 validation
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="classId" style={styles.label}>Class ID:</label>
          <input
            type="text"
            id="classId"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            style={styles.input}
            disabled={isLoading}
            required // HTML5 validation
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
            required // HTML5 validation
          />
        </div>


        {/* Display Messages */}
        {/* Make error message stand out more */}
        {message && <p style={styles.successMessage}>{message}</p>}
        {error && <p style={{...styles.errorMessage, fontWeight: 'bold'}}>{error}</p>}


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

// Basic inline styles (consider using CSS modules or a UI library for larger apps)
// --- Styles remain the same as before ---
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
    gap: '15px', // Spacing between form groups
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
    resize: 'vertical', // Allow vertical resizing
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
  buttonDisabled: { // Style applied via :disabled pseudo-class
    backgroundColor: '#cccccc',
    cursor: 'not-allowed',
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
// Note: Applying disabled styles directly remains tricky with inline styles without JS logic adjustment.
// The `disabled` attribute itself handles the visual state change for standard HTML elements.


export default NoteSubmitter;