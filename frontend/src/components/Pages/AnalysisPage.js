// AnalysisPage.js
import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import HighNote from '../HighNote'; // Import the separated High Note component

function AnalysisPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const classId = searchParams.get('classId');
  const userId = searchParams.get('userId');
  const { token } = useAuth();

  // Common states
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

  // High Note extra states
  const [showAddedFeedback, setShowAddedFeedback] = useState(false);
  const [lastAddedNote, setLastAddedNote] = useState('');
  const [highNoteAdded, setHighNoteAdded] = useState(false);
  const [highNoteContent, setHighNoteContent] = useState('');
  const [showHighNoteView, setShowHighNoteView] = useState(false);
  const [enhancedNotes, setEnhancedNotes] = useState('');
  const highNoteRef = useRef(null);

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
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setNotesContent(notesResponse.data.notes);

        // Fetch Gemini detailed analysis
        try {
          console.log('Fetching detailed note analysis...');
          const analysisResponse = await axios.get(
            'http://localhost:8000/notes/detailed-note-analysis',
            {
              params: { user_id: userId, class_id: classId },
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          console.log('Received analysis response:', analysisResponse.data);

          if (analysisResponse.data.status === 'success') {
            setGeminiAnalysis(analysisResponse.data.analysis);
          } else if (analysisResponse.data.status === 'partial_success') {
            console.warn(
              'Received partial success from Gemini API:',
              analysisResponse.data
            );
            if (analysisResponse.data.basic_analysis) {
              setGeminiAnalysis(analysisResponse.data.basic_analysis);
              setGeminiError(
                'Note: The AI analysis is simplified due to processing limitations.'
              );
            } else {
              setGeminiError(
                'Could not parse Gemini response as JSON. The AI model generated an invalid response format.'
              );
            }
          } else {
            const errorMessage =
              analysisResponse.data.message || 'Unknown error with Gemini analysis';
            const errorDetails = analysisResponse.data.details || '';
            console.error('Analysis error:', errorMessage, errorDetails);
            setGeminiError(
              `${errorMessage}${
                errorDetails ? ` (${errorDetails})` : ''
              }`
            );
          }
        } catch (analysisError) {
          console.error('Failed to fetch Gemini analysis:', analysisError);
          let errorMessage = 'Failed to fetch Gemini analysis';
          if (analysisError.response) {
            errorMessage = `Server error: ${analysisError.response.status} ${analysisError.response.data?.detail || ''}`;
            console.error('Error response:', analysisError.response.data);
          } else if (analysisError.request) {
            errorMessage =
              'No response from server. Please check your connection.';
          }
          setGeminiError(errorMessage);
        }
      } catch (error) {
        console.error(
          'Failed to fetch student notes:',
          error.response?.data || error.message
        );
        setNotesContent([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, classId, token]);

  const generateEnhancedNotes = () => {
    if (!geminiAnalysis || notesContent.length === 0) return '';
  
    const originalNotes = notesContent[0];
    const paragraphs = originalNotes.split(/\n+/).filter(p => p.trim() !== '');
    let annotatedContent = '';
  
    // Extract analysis data
    const coveredTopics = geminiAnalysis.topicCoverage || [];
    const missingTopics = geminiAnalysis.missingTopics || [];
    const datasetKnowledge = geminiAnalysis.datasetKnowledge || [];
    const recommendations = geminiAnalysis.studyRecommendations || [];
  
    console.log("Analysis data for High Note:", {
      topics: coveredTopics,
      missing: missingTopics,
      datasetKnowledge: datasetKnowledge,
      recommendations
    });
  
    const topicImprovements = {};
  
    // Build map for covered topics
    coveredTopics.forEach(topic => {
      topicImprovements[topic] = [];
      datasetKnowledge.forEach(knowledge => {
        const knowledgeStr = typeof knowledge === 'string' ? knowledge : String(knowledge);
        if (knowledgeStr.toLowerCase().includes(topic.toLowerCase())) {
          topicImprovements[topic].push(`From class dataset: ${knowledgeStr}`);
        }
      });
      recommendations.forEach(rec => {
        const recStr = typeof rec === 'string' ? rec : String(rec);
        if (recStr.toLowerCase().includes(topic.toLowerCase())) {
          topicImprovements[topic].push(recStr);
        }
      });
      if (topicImprovements[topic].length === 0) {
        topicImprovements[topic].push(
          `The dataset includes information about ${topic} that you could add to your notes.`
        );
      }
    });
  
    // Build map for missing topics (giving them higher priority)
    missingTopics.forEach(topic => {
      topicImprovements[topic] = [
        `Missing from your notes: ${topic} is covered in the class dataset.`,
        `Consider adding information about ${topic} from the class materials.`
      ];
      datasetKnowledge.forEach(knowledge => {
        const knowledgeStr = typeof knowledge === 'string' ? knowledge : String(knowledge);
        if (knowledgeStr.toLowerCase().includes(topic.toLowerCase())) {
          topicImprovements[topic].push(`From class dataset: ${knowledgeStr}`);
        }
      });
    });
  
    let generalAnnotations = [];
    if (datasetKnowledge.length > 0) {
      generalAnnotations = datasetKnowledge.map(k => `From class dataset: ${k}`);
    }
    if (recommendations.length > 0) {
      generalAnnotations = [...generalAnnotations, ...recommendations];
    }
    if (generalAnnotations.length === 0) {
      generalAnnotations.push(
        "The class dataset contains additional information you could incorporate.",
        "Other students have covered additional topics that might be relevant.",
        "Consider exploring the class materials for additional information.",
        "The dataset includes complementary information to your notes."
      );
    }
  
   // Annotate each paragraph without appending the summary at the bottom
for (let i = 0; i < paragraphs.length; i++) {
  const paragraph = paragraphs[i];
  annotatedContent += paragraph + '\n';
  const mentionedTopics = coveredTopics.filter(topic =>
    paragraph.toLowerCase().includes(topic.toLowerCase())
  );
  const mentionedMissingTopics = missingTopics.filter(topic =>
    paragraph.toLowerCase().includes(topic.toLowerCase())
  );
  const allMentionedTopics = [...mentionedTopics, ...mentionedMissingTopics];

  if (allMentionedTopics.length > 0) {
    let annotations = [];
    for (let j = 0; j < Math.min(2, allMentionedTopics.length); j++) {
      const topic = allMentionedTopics[j];
      if (topicImprovements[topic] && topicImprovements[topic].length > 0) {
        const suggestionIndex = (i + j) % topicImprovements[topic].length;
        let annotation = topicImprovements[topic][suggestionIndex];
        // If annotation is an object, get a descriptive string.
        if (typeof annotation === 'object' && annotation !== null) {
          annotation = annotation.text || annotation.title || JSON.stringify(annotation);
        }
        annotations.push(annotation);
      }
    }
    if (annotations.length === 0 && datasetKnowledge.length > 0) {
      const knowledgeIndex = i % datasetKnowledge.length;
      let rawKnowledge = datasetKnowledge[knowledgeIndex];
      const knowledgeStr =
        typeof rawKnowledge === 'object' && rawKnowledge !== null
          ? (rawKnowledge.text || rawKnowledge.title || JSON.stringify(rawKnowledge))
          : String(rawKnowledge);
      annotations.push(`From class dataset: ${knowledgeStr}`);
    }
    annotations.forEach(annotation => {
      annotatedContent += `<span style="color: #8b5cf6; font-style: italic;">(HIGH NOTE: ${annotation})</span>\n\n`;
    });
  } else {
    if (datasetKnowledge.length > 0) {
      const knowledgeIndex = i % datasetKnowledge.length;
      let rawKnowledge = datasetKnowledge[knowledgeIndex];
      const knowledgeStr =
        typeof rawKnowledge === 'object' && rawKnowledge !== null
          ? (rawKnowledge.text || rawKnowledge.title || JSON.stringify(rawKnowledge))
          : String(rawKnowledge);
      annotatedContent += `<span style="color: #8b5cf6; font-style: italic;">(HIGH NOTE: From class dataset: ${knowledgeStr})</span>\n\n`;
    } else {
      const generalIndex = i % generalAnnotations.length;
      annotatedContent += `<span style="color: #8b5cf6; font-style: italic;">(HIGH NOTE: ${generalAnnotations[generalIndex]})</span>\n\n`;
    }
  }
}

return annotatedContent;

  };
  
  // Activate the High Note view
  const activateHighNote = () => {
    if (!geminiAnalysis || notesContent.length === 0) {
      setShowAddedFeedback(true);
      setLastAddedNote("Cannot create High Note: No notes or analysis available");
      setTimeout(() => setShowAddedFeedback(false), 3000);
      return;
    }
    const enhanced = generateEnhancedNotes();
    setEnhancedNotes(enhanced);
    setShowHighNoteView(true);
  };

  // Close the High Note view and return to main view
  const closeHighNoteView = () => {
    setShowHighNoteView(false);
  };

  // Save High Note to the user's notes and sync to the server
  const saveHighNote = () => {
    if (highNoteAdded) return;
    
    if (notesContent.length > 0) {
      const updatedNotes = [...notesContent];
      updatedNotes[0] = enhancedNotes;
      setNotesContent(updatedNotes);
    } else {
      setNotesContent([enhancedNotes]);
    }
    
    setHighNoteAdded(true);
    setShowAddedFeedback(true);
    setLastAddedNote("High Note saved to your notes!");
    setTimeout(() => setShowAddedFeedback(false), 3000);
    
    const saveNotes = async () => {
      try {
        await axios.post(
          'http://localhost:8000/notes/update-notes',
          {
            user_id: userId,
            class_id: classId,
            notes: [enhancedNotes]
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("Successfully saved High Note to server");
      } catch (error) {
        console.error('Failed to save updated notes:', error);
        setShowAddedFeedback(true);
        setLastAddedNote("Note saved locally, but failed to sync with server");
        setTimeout(() => setShowAddedFeedback(false), 3000);
      }
    };
    saveNotes();
  };

  // Export the High Note as a downloadable HTML file
  const exportToPDF = () => {
    if (!enhancedNotes) return;
    
    setShowAddedFeedback(true);
    setLastAddedNote("Preparing your High Note PDF...");
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>High Note - Your Enhanced Notes</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px;
              line-height: 1.6;
              color: #1a1a1a;
            }
            h1 { 
              color: #8b5cf6; 
              font-size: 24px;
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 2px solid #8b5cf6;
            }
            .content {
              white-space: pre-line;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #8b5cf6;
            }
          </style>
        </head>
        <body>
          <h1>🎵 High Note: Enhanced Study Notes</h1>
          <div class="content">
            ${enhancedNotes.replace(/\n/g, '<br />')}
          </div>
          <div class="footer">
            Generated by High Note | ${new Date().toLocaleDateString()}
          </div>
        </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HighNote-${new Date().toLocaleDateString().replace(/\//g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setLastAddedNote("Notes saved as HTML file!");
      setTimeout(() => setShowAddedFeedback(false), 3000);
    }, 100);
  };

  // Render loading state
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

  // When High Note view is activated, use the separated component
  if (showHighNoteView) {
    return (
      <HighNote
        enhancedNotes={enhancedNotes}
        onClose={closeHighNoteView}
        onExport={exportToPDF}
        highNoteRef={highNoteRef}
        showAddedFeedback={showAddedFeedback}
        lastAddedNote={lastAddedNote}
      />
    );
  }

  // Render the main Analysis page view
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50">
      {showAddedFeedback && (
        <div className="fixed bottom-6 right-6 bg-purple-600 text-white p-4 rounded-xl shadow-lg z-50 animate-slideUp">
          <div className="flex items-center space-x-3">
            <span className="text-xl">✅</span>
            <div>
              <p className="font-medium">Added to your notes!</p>
              <p className="text-sm text-white/80 mt-1 truncate max-w-xs">
                {lastAddedNote.substring(0, 40)}...
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-[95%] mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent animate-gradient">
            Study Analysis
          </h1>
          <p className="text-purple-800/80 mt-2 text-lg">
            Your personalized learning insights
          </p>
        </div>

        {/* High Note Feature Showcase */}
        <div className="mb-12 relative">
          <div className="absolute -top-16 left-0 right-0 h-16 bg-gradient-to-b from-purple-50/0 to-purple-100/50 z-0"></div>
          <div className="relative z-10 bg-gradient-to-r from-purple-500/90 via-indigo-600/90 to-purple-700/90 rounded-2xl shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-0 left-0 w-full h-full bg-black/5"></div>
              <div className="absolute top-[10%] left-[5%] w-20 h-20 bg-purple-300/30 rounded-full filter blur-xl animate-pulse"></div>
              <div className="absolute top-[30%] right-[10%] w-32 h-32 bg-indigo-300/30 rounded-full filter blur-xl animate-pulse" style={{ animationDelay: "1s" }}></div>
              <div className="absolute bottom-[20%] left-[20%] w-24 h-24 bg-purple-400/30 rounded-full filter blur-xl animate-pulse" style={{ animationDelay: "2s" }}></div>
            </div>
            <div className="relative z-20 p-8 md:p-10 flex flex-col md:flex-row items-center">
              <div className="md:w-2/3 text-white mb-6 md:mb-0 md:pr-10">
                <div className="flex items-center mb-3">
                  <span className="text-4xl mr-3">🎵</span>
                  <h2 className="text-3xl font-bold">High Note</h2>
                </div>
                <p className="text-white/90 text-lg mb-4">
                  Transform your notes with AI-powered contextual insights, detailed explanations, and technical annotations.
                </p>
                <p className="text-white/80 text-sm italic">
                  Let High Note analyze your notes to enhance your understanding with expert-level insights tailored to your content.
                </p>
              </div>
              
              <div className="md:w-1/3 flex justify-center">
                <button onClick={activateHighNote} className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-purple-300 to-indigo-400 rounded-full blur opacity-70 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient-xy"></div>
                  <div className="relative px-10 py-6 bg-white rounded-full leading-none flex items-center">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🎵</span>
                      <span className="text-xl font-semibold bg-gradient-to-br from-indigo-600 to-purple-700 bg-clip-text text-transparent">
                        View High Note
                      </span>
                    </div>
                    <div className="ml-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full p-1 transition-all duration-200 group-hover:scale-125 opacity-0 group-hover:opacity-100">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-16 left-0 right-0 h-16 bg-gradient-to-t from-purple-50/0 to-purple-100/50 z-0"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Side - Notes Section */}
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
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      <div className="bg-purple-50/50 p-6 rounded-xl border border-purple-200 transform transition-all duration-300 hover:scale-[1.02]">
                        <h3 className="text-lg font-semibold text-purple-800 mb-4">Topics Coverage</h3>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm text-purple-600 mb-2">
                              <span>Coverage Percentage</span>
                              <span>
                                {geminiAnalysis.topicCoverage && geminiAnalysis.missingTopics
                                  ? `${Math.round(
                                      (geminiAnalysis.topicCoverage.length /
                                        (geminiAnalysis.topicCoverage.length + geminiAnalysis.missingTopics.length)) *
                                        100
                                    )}%`
                                  : '0%'}
                              </span>
                            </div>
                            <div className="h-3 bg-purple-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full transition-all duration-1000"
                                style={{ 
                                  width: geminiAnalysis.topicCoverage && geminiAnalysis.missingTopics
                                    ? `${Math.round(
                                        (geminiAnalysis.topicCoverage.length /
                                          (geminiAnalysis.topicCoverage.length + geminiAnalysis.missingTopics.length)) *
                                        100
                                      )}%`
                                    : '0%'
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-purple-50/50 p-6 rounded-xl border border-purple-200">
                        <h3 className="text-lg font-semibold text-purple-800 mb-4">Quality Assessment</h3>
                        <p className="text-purple-800">
                          {geminiAnalysis.qualityAssessment}
                        </p>
                      </div>
                    </div>
                  )}
                  {activeTab === 'topics' && (
                    <div className="space-y-6">
                      <div className="bg-purple-50/50 p-6 rounded-xl border border-purple-200 transform transition-all duration-300 hover:scale-[1.02]">
                        <h3 className="text-lg font-semibold text-purple-800 mb-4">Topics Covered in Notes</h3>
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
                        <h3 className="text-lg font-semibold text-purple-800 mb-4">Missing Topics Found in Other Student Notes</h3>
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
                  {activeTab === 'performance' &&
                    geminiAnalysis.strengthsAndWeaknesses && (
                      <div className="space-y-6">
                        <div className="bg-purple-50/50 p-6 rounded-xl border border-purple-200 transform transition-all duration-300 hover:scale-[1.02]">
                          <h3 className="text-lg font-semibold text-purple-800 mb-4">Strengths</h3>
                          <ul className="space-y-3">
                            {geminiAnalysis.strengthsAndWeaknesses.strengths?.map((strength, idx) => (
                              <li key={idx} className="flex items-center space-x-3 group">
                                <div className="w-2 h-2 bg-green-400 rounded-full group-hover:scale-150 transition-transform duration-300"></div>
                                <span className="text-purple-800 group-hover:text-green-600 transition-colors duration-300">
                                  {strength}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-purple-50/50 p-6 rounded-xl border border-purple-200 transform transition-all duration-300 hover:scale-[1.02]">
                          <h3 className="text-lg font-semibold text-purple-800 mb-4">
                            Areas for Improvement
                          </h3>
                          <ul className="space-y-3">
                            {geminiAnalysis.strengthsAndWeaknesses.weaknesses?.map((weakness, idx) => (
                              <li key={idx} className="flex items-center space-x-3 group">
                                <div className="w-2 h-2 bg-indigo-400 rounded-full group-hover:scale-150 transition-transform duration-300"></div>
                                <span className="text-purple-800 group-hover:text-indigo-600 transition-colors duration-300">
                                  {weakness}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  {activeTab === 'recommendations' &&
                    geminiAnalysis.studyRecommendations && (
                      <div className="bg-purple-50/50 p-6 rounded-xl border border-purple-200 transform transition-all duration-300 hover:scale-[1.02]">
                        <h3 className="text-lg font-semibold text-purple-800 mb-4">
                          Study Recommendations
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                          {geminiAnalysis.studyRecommendations.map((rec, idx) => (
                            <div
                              key={idx}
                              className="bg-white/50 p-4 rounded-lg border border-purple-200 hover:border-purple-300 transition-all duration-300"
                            >
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
                  <p className="text-purple-600">
                    No analysis available yet.
                  </p>
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
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out forwards;
        }
        @keyframes gradient-xy {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient-xy {
          animation: gradient-xy 3s ease infinite;
          background-size: 400% 400%;
        }
      `}</style>
    </div>
  );
}

export default AnalysisPage;
