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
        throw new Error(errorDetail);
      }

      setMessage(`✅ Note submitted! ID: ${result.id}`);
      setUserId('');
      setContent('');

      const incrementResponse = await fetch(`${API_BASE_URL}/lobbies/${lobbyId}/increment-user-count`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!incrementResponse.ok) {
        const incrementError = await incrementResponse.json();
        console.error('Increment user count failed:', incrementError);
        setError('Note submitted, but failed to increment user count.');
      }
    } catch (err) {
      console.error("Submission failed:", err);
      setError(err.message || 'Failed to submit note.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-xl rounded-xl p-8 border border-white/20 shadow-2xl mt-10 animate-fadeIn text-white">
      <h2 className="text-3xl font-bold mb-2 text-purple-200">📝 Submit a New Note</h2>
      <p className="text-sm text-white/80 mb-6">
        Fill in the details and hit submit. Results will be shown below.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="userId" className="block font-medium mb-1">User ID</label>
          <input
            id="userId"
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            disabled={isLoading}
            required
            className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-white/70"
          />
        </div>

        <div>
          <label htmlFor="classId" className="block font-medium mb-1">Lobby ID</label>
          <input
            id="classId"
            type="text"
            value={lobbyId}
            readOnly
            className="w-full px-4 py-2 rounded-lg bg-gray-600/30 text-white/80 border border-white/30 cursor-not-allowed"
          />
        </div>

        <div>
          <label htmlFor="content" className="block font-medium mb-1">Note Content</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows="6"
            disabled={isLoading}
            required
            className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-white/70 resize-y"
          />
        </div>

        {message && (
          <div className="bg-green-600/20 text-green-300 border border-green-500 px-4 py-2 rounded-lg text-sm font-medium">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-600/20 text-red-300 border border-red-500 px-4 py-2 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 font-bold rounded-lg text-white transition duration-300 ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/40'
          }`}
        >
          {isLoading ? 'Submitting...' : '🚀 Submit Note'}
        </button>
      </form>
    </div>
  );
}

export default NoteSubmitter;
