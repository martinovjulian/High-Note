// src/components/notes/NoteSubmitter.js
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DocumentTextIcon, DocumentArrowUpIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const API_BASE_URL = 'http://localhost:8000';

function NoteSubmitter({ lobbyId, advancedSettings }) {
  const { username, token } = useAuth();
  const [content, setContent] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();

  const MIN_WORD_COUNT = 50;
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleContentChange = (e) => {
    const text = e.target.value;
    setContent(text);
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setError('PDF file size must be less than 10MB');
        setPdfFile(null);
      } else if (file.type !== 'application/pdf') {
        setError('Please upload a PDF file');
        setPdfFile(null);
      } else {
        setError('');
        setPdfFile(file);
      }
    }
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setError('PDF file size must be less than 10MB');
        setPdfFile(null);
        e.target.value = '';
      } else if (file.type !== 'application/pdf') {
        setError('Please upload a PDF file');
        setPdfFile(null);
        e.target.value = '';
      } else {
        setError('');
        setPdfFile(file);
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    // Allow submission if either text content or a PDF is provided
    if (!username || !lobbyId) {
      setError('Please log in and select a lobby.');
      setIsLoading(false);
      return;
    }

    if (!content && !pdfFile) {
      setError('Please provide note text or upload a PDF.');
      setIsLoading(false);
      return;
    }

    if (content && wordCount < MIN_WORD_COUNT) {
      setError(`Please provide at least ${MIN_WORD_COUNT} words in your note.`);
      setIsLoading(false);
      return;
    }

    // Create FormData to combine text and file data
    const formData = new FormData();
    formData.append("user_id", username);
    formData.append("class_id", lobbyId);
    formData.append("content", content || ""); // Always append content, even if empty
    if (pdfFile) {
      formData.append("pdf_file", pdfFile);
    }

    try {
      // Submit note (and PDF file if provided)
      const submitResponse = await fetch(`${API_BASE_URL}/notes/submit-note`, {
        method: 'POST',
        headers: {
          // Do not set Content-Type with FormData – it is set automatically.
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      let submitResult = {};
      try {
        submitResult = await submitResponse.json();
      } catch (parseError) {
        console.error("Could not parse response JSON:", parseError);
        if (submitResponse.ok) {
          submitResult = {};
        } else {
          throw new Error(`HTTP error! Status: ${submitResponse.status}. Response not valid JSON.`);
        }
      }

      if (!submitResponse.ok) {
        let errorDetail = `HTTP error! Status: ${submitResponse.status}`;
        if (submitResult && submitResult.detail) {
          if (typeof submitResult.detail === 'string') {
            errorDetail = submitResult.detail;
          } else if (Array.isArray(submitResult.detail)) {
            errorDetail = submitResult.detail
              .map(err => `${err.loc ? err.loc.join('.') : 'error'}: ${err.msg}`)
              .join('; ');
          } else {
            errorDetail = JSON.stringify(submitResult.detail);
          }
        }
        throw new Error(errorDetail);
      }

      // Optionally increment the lobby's user count
      // Optionally increment the lobby's user count
await fetch(`${API_BASE_URL}/lobby/lobbies/${lobbyId}/increment-user-count`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
});

// Run update_student_concepts with student-specific settings
try {
  const updatePayload = {
    user_id: username,
    class_id: lobbyId,
    num_concepts: advancedSettings.numConceptsStudent,
    similarity_threshold: advancedSettings.similarityThresholdUpdate,
  };
  console.log("Attempting to update student concepts with payload:", updatePayload);

  const updateResponse = await fetch(`${API_BASE_URL}/notes/update-student-concepts`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updatePayload),
  });

  console.log("Update student concepts response status:", updateResponse.status);

  const updateResult = await updateResponse.json();
  console.log("Update student concepts response data:", updateResult);
} catch (error) {
  console.error("Error updating student concepts:", error);
}

// Run analyze_concepts_enhanced with class-specific settings
const analyzeResponse = await fetch(
  `${API_BASE_URL}/notes/analyze-concepts-enhanced?user_id=${username}&class_id=${lobbyId}` +
    `&num_concepts=${advancedSettings.numConceptsClass}` +
    `&similarity_threshold=${advancedSettings.similarityThresholdUpdate}` +
    `&sim_threshold=${advancedSettings.similarityThresholdAnalyze}`,
  {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  }
);


      let analyzeResult = {};
      try {
        analyzeResult = await analyzeResponse.json();
      } catch (parseError) {
        console.error("Error parsing analyze response:", parseError);
        analyzeResult = {};
      }

      if (analyzeResult.status === "insufficient_notes") {
        // Show success message but don't redirect
        alert(analyzeResult.message);
        // Clear the form
        setContent('');
        setPdfFile(null);
        setIsLoading(false);
        return;
      }

      // Redirect to Analysis page passing the missing concepts via router state.
      navigate(
        `/analysis?classId=${lobbyId}&userId=${username}`,
        { state: { missingConcepts: analyzeResult.missing_concepts || [] } }
      );
    } catch (err) {
      console.error("Submission failed:", err);
      setError(err.message || 'Failed to submit note.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-xl rounded-xl p-8 border border-white/20 shadow-2xl mt-10 animate-fadeIn text-white transform hover:scale-[1.02] transition-transform duration-300">
      <div className="flex items-center gap-2 mb-2">
        <DocumentTextIcon className="h-8 w-8 text-white" />
        <h2 className="text-3xl font-bold text-white">Submit a New Note</h2>
      </div>
      <p className="text-sm text-white/80 mb-6">
        Fill in the details, upload a PDF if needed, and hit submit. You will be redirected to view your analysis.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="content" className="block font-medium mb-1 text-white">
            Note Content
          </label>
          <textarea
            id="content"
            value={content}
            onChange={handleContentChange}
            rows="6"
            disabled={isLoading}
            placeholder="Enter your note text here (minimum 50 words)"
            className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/70 resize-y transition-all duration-300 hover:bg-white/30"
          />
          <div className="mt-2 text-sm text-white/70">
            Word count: {wordCount}/{MIN_WORD_COUNT} words
            {wordCount >= MIN_WORD_COUNT ? (
              <span className="ml-2 text-green-400">✓ Minimum requirement met</span>
            ) : (
              <span className="ml-2 text-red-400">✗ Minimum requirement not met</span>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="pdfFile" className="block font-medium mb-1 text-white">
            Upload PDF (optional)
          </label>
          <div
            className={`w-full p-6 border-2 border-dashed rounded-lg transition-all duration-300 ${
              isDragging
                ? 'border-white/50 bg-white/10'
                : 'border-white/30 hover:border-white/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <DocumentArrowUpIcon className="h-8 w-8 text-white/70" />
              <p className="text-sm text-white/70">
                Drag and drop your PDF here, or{' '}
                <label htmlFor="pdfFile" className="text-white cursor-pointer hover:text-white/80">
                  click to browse
                </label>
              </p>
              {pdfFile && (
                <p className="text-sm text-white/70 mt-2">
                  Selected file: {pdfFile.name}
                </p>
              )}
            </div>
            <input
              id="pdfFile"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              disabled={isLoading}
              className="hidden"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-600/20 text-red-300 border border-red-500 px-4 py-2 rounded-lg text-sm font-medium animate-shake">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || (content && wordCount < MIN_WORD_COUNT)}
          className={`w-full py-3 font-bold rounded-lg text-white transition duration-300 ${
            isLoading || (content && wordCount < MIN_WORD_COUNT)
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 hover:scale-105 hover:shadow-lg hover:shadow-white/20'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
              Processing...
            </div>
          ) : (
            'Analyze'
          )}
        </button>
      </form>
    </div>
  );
}

export default NoteSubmitter;
