// src/hooks/useAuth.js
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext'; // Import the context from its definition file

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // This check ensures the hook is only used within an AuthProvider
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
