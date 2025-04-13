import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  const handleLearnMore = () => {
    // You can define what happens when Learn More is clicked
    // For example, scroll to a features section or navigate to an about page
    console.log('Learn more clicked');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <nav className="flex justify-between items-center py-6">
          <div className="text-3xl font-bold bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">
            NoteSync
          </div>
          <div className="space-x-8">
            <a href="#features" className="text-white hover:text-purple-300 transition-colors">Features</a>
            <a href="#how-it-works" className="text-white hover:text-purple-300 transition-colors">How It Works</a>
            <a href="#about" className="text-white hover:text-purple-300 transition-colors">About</a>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="flex flex-col md:flex-row items-center justify-between py-16 min-h-[80vh]">
          <div className="md:w-1/2 md:pr-8 mb-12 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Transform Your Study Experience with AI-Powered Insights
            </h1>
            <p className="text-xl mb-8 opacity-90">
              Discover what you're missing in your notes compared to peers. Get personalized recommendations and improve your understanding.
            </p>

            {/* Feature Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-sm border border-white border-opacity-20 
                  transform transition-all hover:-translate-y-1 hover:shadow-lg">
                <h3 className="text-xl font-semibold mb-2 text-purple-300">Identify Knowledge Gaps</h3>
                <p>See concepts your classmates captured that you missed, and get targeted study recommendations.</p>
              </div>
              <div className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-sm border border-white border-opacity-20 
                  transform transition-all hover:-translate-y-1 hover:shadow-lg">
                <h3 className="text-xl font-semibold mb-2 text-purple-300">AI-Enhanced Analysis</h3>
                <p>Our cutting-edge AI analyzes note patterns to provide deeper insights than simple comparison.</p>
              </div>
              <div className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-sm border border-white border-opacity-20 
                  transform transition-all hover:-translate-y-1 hover:shadow-lg">
                <h3 className="text-xl font-semibold mb-2 text-purple-300">Upload Any Format</h3>
                <p>Type notes directly or upload PDFs - our system works with your preferred note-taking method.</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={handleGetStarted}
                className="px-8 py-3 bg-white text-indigo-800 font-bold rounded-full shadow-md hover:-translate-y-1 transform transition-all hover:shadow-lg">
                Get Started
              </button>
              <button 
                onClick={handleLearnMore}
                className="px-8 py-3 bg-transparent border-2 border-white text-white font-bold rounded-full hover:-translate-y-1 transform transition-all hover:shadow-lg">
                Learn More
              </button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="md:w-1/2 flex justify-center">
            <div className="relative w-full max-w-md">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-2xl p-1">
                <img 
                  src="https://via.placeholder.com/500x400/6a3de8/FFFFFF?text=NoteSync" 
                  alt="NoteSync App Demo" 
                  className="w-full h-auto rounded"
                />
              </div>
              <div className="absolute -top-4 -right-4 bg-purple-500 rounded-full w-16 h-16 flex items-center justify-center text-white font-bold text-sm">
                AI Powered
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LandingPage;