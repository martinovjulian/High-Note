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
  const [activeTab, setActiveTab] = useState('overview');
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredNote, setHoveredNote] = useState(null);

  useEffect(() => {
    if (!userId || !classId) {
      console.warn('Missing userId or classId from URL:', { userId, classId });
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch notes
        const notesResponse = await axios.get(
          'http://localhost:8000/notes/get-student-notes',
          {
            params: { user_id: userId, class_id: classId },
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setNotesContent(notesResponse.data.notes);

        // Fetch Gemini detailed analysis
        try {
          console.log("Fetching detailed note analysis...");
          const analysisResponse = await axios.get(
            'http://localhost:8000/notes/detailed-note-analysis',
            {
              params: { user_id: userId, class_id: classId },
              headers: { Authorization: `Bearer ${token}` }
            }
          );

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
            errorMessage = `Server error: ${analysisError.response.status} ${analysisError.response.data?.detail || ''}`;
            console.error('Error response:', analysisError.response.data);
          } else if (analysisError.request) {
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
            <div className="absolute inset-0 rounded-full border-4 border-purple-400 border-t-transparent animate-spin" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-300 to-purple-400 animate-pulse"></div>
          </div>
          <p className="text-lg font-medium text-purple-800 tracking-wide animate-pulse">
            Analyzing your notes with AI
            <span className="animate-bounce inline-block">.</span>
            <span className="animate-bounce inline-block delay-150">.</span>
            <span className="animate-bounce inline-block delay-300">.</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50">
      <div className="max-w-[95%] mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent animate-gradient">
            Study Analysis
          </h1>
          <p className="text-purple-800/80 mt-2 text-lg">Your personalized learning insights</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Side - Notes Section (Larger) */}
          <div className="lg:col-span-7 bg-white/90 rounded-2xl shadow-xl border border-purple-100 overflow-hidden transform transition-all duration-300 hover:shadow-2xl">
            <div className="p-6 border-b border-purple-100">
              <h2 className="text-2xl font-semibold text-purple-800">Your Notes</h2>
              <p className="text-purple-600 mt-1">Review and edit your study materials</p>
            </div>
            <div className="p-6 h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar">
              {notesContent.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-purple-600 italic">No notes found for this class and user.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {notesContent.map((note, index) => (
                    <div 
                      key={index} 
                      className={`group relative transform transition-all duration-300 ${
                        hoveredNote === index ? 'scale-[1.02]' : ''
                      }`}
                      onMouseEnter={() => setHoveredNote(index)}
                      onMouseLeave={() => setHoveredNote(null)}
                    >
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="text-xs text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                          Note {index + 1}
                        </span>
                      </div>
                      <textarea
                        value={note}
                        onChange={(e) => {
                          const updated = [...notesContent];
                          updated[index] = e.target.value;
                          setNotesContent(updated);
                        }}
                        className={`w-full bg-purple-50/50 text-purple-900 p-4 rounded-xl shadow-sm border ${
                          hoveredNote === index 
                            ? 'border-purple-400 ring-2 ring-purple-200' 
                            : 'border-purple-200'
                        } focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all duration-300 resize-none`}
                        rows={isExpanded ? 20 : 12}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Analytics Dashboard */}
          <div className="lg:col-span-5 bg-white/90 rounded-2xl shadow-xl border border-purple-100 overflow-hidden transform transition-all duration-300 hover:shadow-2xl">
            <div className="p-6 border-b border-purple-100">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-purple-800">Analysis</h2>
                <div className="flex space-x-2">
                  {['overview', 'topics', 'performance', 'recommendations'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-300 ${
                        activeTab === tab
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'text-purple-600 hover:text-purple-800 hover:bg-purple-50'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar">
              {geminiError ? (
                <div className="bg-red-50 border border-red-100 p-6 rounded-xl">
                  <h2 className="text-xl font-semibold mb-2 text-red-800">Analysis Status</h2>
                  <p className="text-red-600">{geminiError}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-4 bg-red-100 hover:bg-red-200 text-red-800 font-medium py-2 px-4 rounded-lg transition-colors duration-300 border border-red-200"
                  >
                    Try Again
                  </button>
                </div>
              ) : geminiAnalysis ? (
                <div className="space-y-6">
                  {/* Overview Card */}
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      <div className="bg-purple-50/50 p-6 rounded-xl border border-purple-200 transform transition-all duration-300 hover:scale-[1.02]">
                        <h3 className="text-lg font-semibold text-purple-800 mb-4">Topics Coverage</h3>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm text-purple-600 mb-2">
                              <span>Covered Topics</span>
                              <span>{geminiAnalysis.topicCoverage?.length || 0}</span>
                            </div>
                            <div className="h-3 bg-purple-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full transition-all duration-1000"
                                style={{ width: '75%' }}
                              ></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm text-purple-600 mb-2">
                              <span>Missing Topics</span>
                              <span>{geminiAnalysis.missingTopics?.length || 0}</span>
                            </div>
                            <div className="h-3 bg-purple-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-orange-400 to-red-400 rounded-full transition-all duration-1000"
                                style={{ width: '25%' }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-purple-50/50 p-6 rounded-xl border border-purple-200">
                        <h3 className="text-lg font-semibold text-purple-800 mb-4">Quality Assessment</h3>
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-indigo-400 flex items-center justify-center shadow-lg">
                            <span className="text-3xl font-bold text-white">B+</span>
                          </div>
                          <p className="text-purple-800 flex-1">{geminiAnalysis.qualityAssessment}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Topics Card */}
                  {activeTab === 'topics' && (
                    <div className="space-y-6">
                      <div className="bg-purple-50/50 p-6 rounded-xl border border-purple-200 transform transition-all duration-300 hover:scale-[1.02]">
                        <h3 className="text-lg font-semibold text-purple-800 mb-4">Covered Topics</h3>
                        <ul className="space-y-3">
                          {geminiAnalysis.topicCoverage?.map((topic, idx) => (
                            <li key={idx} className="flex items-center space-x-3 group">
                              <div className="w-2 h-2 bg-purple-400 rounded-full group-hover:scale-150 transition-transform duration-300"></div>
                              <span className="text-purple-800 group-hover:text-purple-600 transition-colors duration-300">{topic}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-purple-50/50 p-6 rounded-xl border border-purple-200 transform transition-all duration-300 hover:scale-[1.02]">
                        <h3 className="text-lg font-semibold text-purple-800 mb-4">Missing Topics</h3>
                        <ul className="space-y-3">
                          {geminiAnalysis.missingTopics?.map((topic, idx) => (
                            <li key={idx} className="flex items-center space-x-3 group">
                              <div className="w-2 h-2 bg-indigo-400 rounded-full group-hover:scale-150 transition-transform duration-300"></div>
                              <span className="text-purple-800 group-hover:text-indigo-600 transition-colors duration-300">{topic}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Performance Card */}
                  {activeTab === 'performance' && geminiAnalysis.strengthsAndWeaknesses && (
                    <div className="space-y-6">
                      <div className="bg-purple-50/50 p-6 rounded-xl border border-purple-200 transform transition-all duration-300 hover:scale-[1.02]">
                        <h3 className="text-lg font-semibold text-purple-800 mb-4">Strengths</h3>
                        <ul className="space-y-3">
                          {geminiAnalysis.strengthsAndWeaknesses.strengths?.map((strength, idx) => (
                            <li key={idx} className="flex items-center space-x-3 group">
                              <div className="w-2 h-2 bg-green-400 rounded-full group-hover:scale-150 transition-transform duration-300"></div>
                              <span className="text-purple-800 group-hover:text-green-600 transition-colors duration-300">{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-purple-50/50 p-6 rounded-xl border border-purple-200 transform transition-all duration-300 hover:scale-[1.02]">
                        <h3 className="text-lg font-semibold text-purple-800 mb-4">Areas for Improvement</h3>
                        <ul className="space-y-3">
                          {geminiAnalysis.strengthsAndWeaknesses.weaknesses?.map((weakness, idx) => (
                            <li key={idx} className="flex items-center space-x-3 group">
                              <div className="w-2 h-2 bg-indigo-400 rounded-full group-hover:scale-150 transition-transform duration-300"></div>
                              <span className="text-purple-800 group-hover:text-indigo-600 transition-colors duration-300">{weakness}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Recommendations Card */}
                  {activeTab === 'recommendations' && geminiAnalysis.studyRecommendations && (
                    <div className="bg-purple-50/50 p-6 rounded-xl border border-purple-200 transform transition-all duration-300 hover:scale-[1.02]">
                      <h3 className="text-lg font-semibold text-purple-800 mb-4">Study Recommendations</h3>
                      <div className="grid grid-cols-1 gap-4">
                        {geminiAnalysis.studyRecommendations.map((rec, idx) => (
                          <div key={idx} className="bg-white/50 p-4 rounded-lg border border-purple-200 hover:border-purple-300 transition-all duration-300">
                            <div className="flex items-center space-x-3">
                              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                              <p className="text-purple-800">{rec}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-purple-600">No analysis available yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(147, 51, 234, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(251, 191, 36, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(251, 191, 36, 0.5);
        }
      `}</style>
    </div>
  );
}

export default AnalysisPage;
