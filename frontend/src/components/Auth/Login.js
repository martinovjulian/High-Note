import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AuthForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const { login, signup, showLogin, toggleAuthMode } = useAuth();
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      let success = false;
      
      if (showLogin) {
        success = await login(username, password);
      } else {
        success = await signup({
          username,
          email,
          full_name: fullName,
          password
        });
      }

      if (success) {
        navigate('/app');
      }
    } catch (error) {
      setError(error.message || 'An error occurred during authentication');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-800 to-purple-900 text-white animate-fadeIn">
      {/* Video Background */}
      <video 
        autoPlay 
        loop 
        muted 
        playsInline
        className="absolute w-full h-full object-cover z-0"
        style={{ filter: 'brightness(0.3)' }}
      >
        <source src="/students-stuying.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Auth Form Container with glass morphism effect */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/10 transform transition-all duration-300 hover:scale-[1.02]">
            {/* Decorative white elements */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/5 rounded-full blur-xl"></div>
            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
            
            <div className="text-center mb-8 relative z-10">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                {showLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-purple-100/90 mt-2">
                {showLogin ? 'Sign in to continue' : 'Join our learning community'}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg backdrop-blur-sm animate-fadeIn">
                <p className="text-red-200">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-purple-100/90 mb-2">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent text-white placeholder-purple-200/50 backdrop-blur-sm"
                    placeholder="Enter your username"
                    required
                  />
                </div>

                {!showLogin && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-purple-100/90 mb-2">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent text-white placeholder-purple-200/50 backdrop-blur-sm"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-purple-100/90 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent text-white placeholder-purple-200/50 backdrop-blur-sm"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-purple-100/90 mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent text-white placeholder-purple-200/50 backdrop-blur-sm"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600/90 via-white/20 to-indigo-600/90 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700/90 hover:via-white/30 hover:to-indigo-700/90 transform transition-all duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-purple-900/50 shadow-lg shadow-purple-500/20"
              >
                {showLogin ? 'Sign In' : 'Create Account'}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={toggleAuthMode}
                  className="text-purple-100/90 hover:text-white transition-colors duration-200 text-sm"
                >
                  {showLogin
                    ? "Don't have an account? Sign Up"
                    : "Already have an account? Sign In"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;