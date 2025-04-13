import React, { useEffect, useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

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
  const [geminiAnalysis, setGeminiAnalysis] = useState(null);
  const [geminiError, setGeminiError] = useState(null);

  useEffect(() => {
    if (!userId || !classId) {
      console.warn('Missing userId or classId from URL:', { userId, classId });
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch notes
        const notesResponse = await axios.get('http://localhost:8000/notes/get-student-notes', {
          params: { user_id: userId, class_id: classId },
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotesContent(notesResponse.data.notes);

        // Fetch Gemini detailed analysis
        try {
          console.log("Fetching detailed note analysis...");
          const analysisResponse = await axios.get('http://localhost:8000/notes/detailed-note-analysis', {
            params: { user_id: userId, class_id: classId },
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log("Received analysis response:", analysisResponse.data);
          
          if (analysisResponse.data.status === 'success') {
            setGeminiAnalysis(analysisResponse.data.analysis);
          } else if (analysisResponse.data.status === 'partial_success') {
            console.warn('Received partial success from Gemini API:', analysisResponse.data);
            // Use the basic analysis if available
            if (analysisResponse.data.basic_analysis) {
              setGeminiAnalysis(analysisResponse.data.basic_analysis);
              setGeminiError('Note: The AI analysis is simplified due to processing limitations.');
            } else {
              setGeminiError('Could not parse Gemini response as JSON. The AI model generated an invalid response format.');
            }
          } else {
            const errorMessage = analysisResponse.data.message || 'Unknown error with Gemini analysis';
            const errorDetails = analysisResponse.data.details || '';
            console.error('Analysis error:', errorMessage, errorDetails);
            setGeminiError(`${errorMessage}${errorDetails ? ` (${errorDetails})` : ''}`);
          }
        } catch (analysisError) {
          console.error('Failed to fetch Gemini analysis:', analysisError);
          
          // More detailed error message
          let errorMessage = 'Failed to fetch Gemini analysis';
          
          if (analysisError.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            errorMessage = `Server error: ${analysisError.response.status} ${analysisError.response.data?.detail || ''}`;
            console.error('Error response:', analysisError.response.data);
          } else if (analysisError.request) {
            // The request was made but no response was received
            errorMessage = 'No response from server. Please check your connection.';
          }
          
          setGeminiError(errorMessage);
        }
      } catch (error) {
        console.error('Failed to fetch student notes:', error.response?.data || error.message);
        setNotesContent([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
            Analyzing your notes with AI
            <span className="animate-bounce inline-block">.</span>
            <span className="animate-bounce inline-block delay-150">.</span>
            <span className="animate-bounce inline-block delay-300">.</span>
          </p>
        </div>
      </div>
    );
  }

  // Helper function to render a section of the Gemini analysis
  const renderAnalysisSection = (title, data, isListItem = true) => {
    if (!data || (Array.isArray(data) && data.length === 0)) return null;
    
    return (
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        {isListItem ? (
          <ul className="space-y-2">
            {Array.isArray(data) ? data.map((item, idx) => (
              <li key={idx} className="bg-purple-900 bg-opacity-50 p-3 rounded-md">
                {item}
              </li>
            )) : data}
          </ul>
        ) : (
          <p className="bg-purple-900 bg-opacity-50 p-3 rounded-md">{data}</p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-800 to-purple-600 text-white py-10 px-4">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* AI Analysis Section */}
        {geminiAnalysis && (
          <div className="bg-white/10 p-8 rounded-2xl shadow-2xl mb-8">
            <h2 className="text-3xl font-bold mb-6 text-white border-b border-purple-200 pb-2">
              AI Analysis of Your Notes
            </h2>
            
            {renderAnalysisSection("Topics Covered", geminiAnalysis.topicCoverage)}
            {renderAnalysisSection("Missing Topics", geminiAnalysis.missingTopics)}
            {renderAnalysisSection("Quality Assessment", geminiAnalysis.qualityAssessment, false)}
            
            {geminiAnalysis.strengthsAndWeaknesses && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  {renderAnalysisSection("Your Strengths", geminiAnalysis.strengthsAndWeaknesses.strengths)}
                </div>
                <div>
                  {renderAnalysisSection("Areas for Improvement", geminiAnalysis.strengthsAndWeaknesses.weaknesses)}
                </div>
              </div>
            )}
            
            {renderAnalysisSection("Study Recommendations", geminiAnalysis.studyRecommendations)}
          </div>
        )}
        
        {geminiError && (
          <div className="bg-red-800/30 p-6 rounded-xl mb-8">
            <h2 className="text-xl font-semibold mb-2">Analysis Status</h2>
            <p>{geminiError}</p>
            <div className="mt-4">
              <button 
                onClick={() => window.location.reload()}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Original Missing Concepts Section */}
        {missingConcepts && missingConcepts.length > 0 && (
          <div className="bg-white/10 p-6 rounded-2xl shadow-lg mb-8">
            <h2 className="text-2xl font-semibold mb-4 border-b border-white/30 pb-2">Key Concepts You're Missing</h2>
            <ul className="space-y-3">
              {missingConcepts.map((concept, index) => (
                <li key={index} className="bg-purple-700 bg-opacity-80 p-3 rounded shadow">
                  {concept}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Notes Content Section */}
        <div className="bg-white/10 p-8 rounded-2xl shadow-2xl">
          <h2 className="text-2xl font-semibold mb-6 text-white border-b border-purple-200 pb-2">
            Your Submitted Notes
          </h2>
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
      </div>
    </div>
  );
}

export default AnalysisPage;
