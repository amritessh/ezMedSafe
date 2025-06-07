import { createContext, useState, useContext, useEffect } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  // const [userId, setUserId] = useState(null);
  const [userId, setUserId] = useState('dummy_user_id');
  const [loading, setLoading] = useState(false); // To check local storage on mount

  // useEffect(() => {
  //   // Check for API key in local storage on component mount
  //   const storedApiKey = localStorage.getItem('ezmedsafe_api_key');
  //   if (storedApiKey) {
  //     // In a real app, you'd send this to backend to verify validity
  //     // For MVP, if key exists, consider logged in (simplified)
  //     setIsAuthenticated(true);
  //     // Optionally store userId if you need it globally from the login response
  //     setUserId(localStorage.getItem('ezmedsafe_user_id'));
  //   }
  //   setLoading(false);
  // }, []);

  useEffect(() => {
    // You can still keep basic localStorage for a dummy API key if routes need it
    if (!localStorage.getItem('ezmedsafe_api_key')) {
      localStorage.setItem('ezmedsafe_api_key', '1234'); // Ensure a default key exists
      localStorage.setItem(
        'ezmedsafe_user_id',
        '123e4567-e89b-12d3-a456-426614174000'
      );
    }
    // No actual verification needed for this bypass
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
