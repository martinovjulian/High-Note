// HighNote.js
import React from 'react';

function HighNote({
  enhancedNotes,
  onClose,
  onExport,
  highNoteRef,
  showAddedFeedback,
  lastAddedNote,
}) {
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
        <div className="mb-8 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              <span className="mr-2">🎵</span> High Note View
            </h1>
          </div>
          <button
            onClick={onExport}
            className="px-6 py-2 rounded-lg font-medium transition-all duration-300 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-lg flex items-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Save Notes
          </button>
        </div>
        <div className="bg-white/90 rounded-2xl shadow-xl border border-purple-100 overflow-hidden">
          <div className="p-6 border-b border-purple-100">
            <h2 className="text-2xl font-semibold text-purple-800">
              Enhanced Notes
            </h2>
            <p className="text-purple-600 mt-1">
              Your notes with integrated AI insights
            </p>
          </div>
          <div
            className="p-6 min-h-[calc(100vh-12rem)] max-h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar"
            ref={highNoteRef}
          >
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-line">
                <div
                  dangerouslySetInnerHTML={{
                    __html: enhancedNotes.replace(/\n/g, '<br />'),
                  }}
                />
              </div>
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
      `}</style>
    </div>
  );
}

export default HighNote;
