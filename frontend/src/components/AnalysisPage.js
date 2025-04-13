import React, { useEffect, useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function AnalysisPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const classId = searchParams.get('classId');
  const userId = searchParams.get('userId');
  const { token } = useAuth();

  const [notesContent, setNotesContent] = useState([]);
  const [missingConcepts, setMissingConcepts] = useState(
    location.state?.missingConcepts || []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !classId) {
      console.warn('Missing userId or classId from URL:', { userId, classId });
      setLoading(false);
      return;
    }

    const fetchNotes = async () => {
      try {
        const response = await axios.get('http://localhost:8000/notes/get-student-notes', {
          params: { user_id: userId, class_id: classId },
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotesContent(response.data.notes);
      } catch (error) {
        console.error('Failed to fetch student notes:', error.response?.data || error.message);
        setNotesContent([]);
      }
    };

    fetchNotes();
    const delay = setTimeout(() => setLoading(false), 5000);
    return () => clearTimeout(delay);
  }, [userId, classId, token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-800 via-purple-700 to-purple-600">
        <div className="flex flex-col items-center bg-white p-8 rounded-2xl shadow-lg">
          <div className="relative w-16 h-16 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-green-600 border-t-transparent animate-spin" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-green-400 to-emerald-600"></div>
          </div>
          <p className="text-lg font-medium text-black tracking-wide animate-pulse">
            Analyzing your notes
            <span className="animate-bounce inline-block">.</span>
            <span className="animate-bounce inline-block delay-150">.</span>
            <span className="animate-bounce inline-block delay-300">.</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-800 to-purple-600 text-white py-10 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1 bg-white/10 p-8 rounded-2xl shadow-2xl">
          <h1 className="text-4xl font-bold mb-6 text-white border-b border-purple-200 pb-2">
            Your Submitted Notes
          </h1>
          {notesContent.length === 0 ? (
            <p className="text-gray-300 italic">No notes found for this class and user.</p>
          ) : (
            notesContent.map((note, index) => (
              <textarea
                key={index}
                value={note}
                onChange={(e) => {
                  const updated = [...notesContent];
                  updated[index] = e.target.value;
                  setNotesContent(updated);
                }}
                className="w-full bg-white text-black p-4 rounded-xl mb-4 shadow-md resize-none whitespace-pre-wrap"
                rows={10}
              />
            ))
          )}
        </div>

        {/* Sidebar for Missing Concepts */}
        {missingConcepts && missingConcepts.length > 0 && (
          <aside className="w-full md:w-1/3 bg-white/20 p-6 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-semibold mb-4 border-b border-white/30 pb-2">Missing Concepts</h2>
            <ul className="space-y-3">
              {missingConcepts.map((concept, index) => (
                <li key={index} className="bg-purple-700 bg-opacity-80 p-3 rounded shadow">
                  {concept}
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}

export default AnalysisPage;
