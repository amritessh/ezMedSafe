import React, { createContext, useState, useContext, useEffect } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true); // To check local storage on mount

  useEffect(() => {
    // Check for API key in local storage on component mount
    const storedApiKey = localStorage.getItem('ezmedsafe_api_key');
    if (storedApiKey) {
      // In a real app, you'd send this to backend to verify validity
      // For MVP, if key exists, consider logged in (simplified)
      setIsAuthenticated(true);
      // Optionally store userId if you need it globally from the login response
      setUserId(localStorage.getItem('ezmedsafe_user_id'));
    }
    setLoading(false);
  }, []);

  const login = (apiKey, id) => {
    localStorage.setItem('ezmedsafe_api_key', apiKey);
    localStorage.setItem('ezmedsafe_user_id', id);
    setIsAuthenticated(true);
    setUserId(id);
  };

  const logout = () => {
    localStorage.removeItem('ezmedsafe_api_key');
    localStorage.removeItem('ezmedsafe_user_id');
    setIsAuthenticated(false);
    setUserId(null);
  };

  // Provide auth state and functions to children
  const value = {
    isAuthenticated,
    userId,
    login,
    logout,
    loading // Indicate if auth state is still being loaded
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}{' '}
      {/* Render children only after loading is complete */}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
