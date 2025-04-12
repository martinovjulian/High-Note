import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState(null);
  const [showLogin, setShowLogin] = useState(true); // true for login, false for signup

  // Initialize state from localStorage only once when component mounts
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    
    // Only set the token if it exists and is valid
    if (storedToken) {
      setToken(storedToken);
      setUsername(storedUsername);
    }
  }, []);

  const signup = async (userData) => {
    try {
      const response = await fetch('http://localhost:8000/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: {
            username: userData.username,
            email: userData.email,
            full_name: userData.full_name
          },
          password: userData.password
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Signup failed');
      }
      
      // After successful signup, automatically log the user in
      return await login(userData.username, userData.password);
    } catch (error) {
      console.error('Signup error:', error);
      throw error; // Re-throw the error to handle it in the component
    }
  };

  const login = async (username, password) => {
    try {
      const response = await fetch('http://localhost:8000/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `username=${username}&password=${password}`,
      });
      
      if (!response.ok) throw new Error('Login failed');
      
      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('username', username);
      setToken(data.access_token);
      setUsername(username);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
    setUsername(null);
  };

  const toggleAuthMode = () => {
    setShowLogin(!showLogin);
  };

  return (
    <AuthContext.Provider value={{ 
      token, 
      username, 
      login, 
      logout, 
      signup,
      showLogin,
      toggleAuthMode
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 