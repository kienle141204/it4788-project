// PrivateRoute component to protect admin-only routes
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    // Show loading state while checking authentication
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login using window.location
  if (!isAuthenticated()) {
    window.location.href = '/login';
    return null;
  }

  return children;
};

export default PrivateRoute;
