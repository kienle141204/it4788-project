// AuthContext for managing authentication state
import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState({
    access_token: localStorage.getItem('access_token'),
    refresh_token: localStorage.getItem('refresh_token')
  });

  // Check if token is expired
  const isTokenExpired = (token) => {
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  };

  // Refresh access token
  const refreshToken = async () => {
    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
      return null;
    }

    try {
      const response = await fetch('https://it4788-project-ttac.onrender.com/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Token refresh failed');
      }

      // Update tokens
      localStorage.setItem('access_token', data.access_token);
      setTokens(prev => ({
        ...prev,
        access_token: data.access_token
      }));

      // Update user info if it's available in refresh response
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
      }

      return data.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      logout(); // If refresh fails, logout user
      return null;
    }
  };

  // Check if user is logged in on app start
  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const accessToken = localStorage.getItem('access_token');

      if (storedUser && accessToken) {
        // Check if token is expired
        if (isTokenExpired(accessToken)) {
          // Attempt to refresh the token
          const newToken = await refreshToken();
          if (newToken) {
            // Token was refreshed successfully, set the user
            setUser(JSON.parse(storedUser));
          }
          // If refresh failed, the refreshToken function already cleared the data and logged out the user
        } else {
          // Token is still valid, set the user
          setUser(JSON.parse(storedUser));
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await fetch('https://it4788-project-ttac.onrender.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Check if user role is admin
      if (data.user?.role !== 'admin') {
        throw new Error('Access denied. Admin role required.');
      }

      // Store tokens and user info in localStorage
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setTokens({
        access_token: data.access_token,
        refresh_token: data.refresh_token
      });
      setUser(data.user);

      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  // Logout function
  const logout = () => {
    // Clear all stored data
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');

    setTokens({ access_token: null, refresh_token: null });
    setUser(null);

    // Navigate to login by updating window location instead of using useNavigate
    window.location.href = '/login';
  };

  // Make authenticated API request with token handling
  const apiRequest = async (endpoint, options = {}) => {
    // This function is not needed since we use the authFetch utility
    // The authFetch utility handles token refresh automatically
    console.warn('apiRequest is deprecated. Use the API services that use authFetch instead.');
    return Promise.reject(new Error('Use API services that use authFetch instead of apiRequest'));
  };

  // Check if user is authenticated and has admin role
  const isAuthenticated = () => {
    return user && user.role === 'admin';
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated,
    apiRequest,
    tokens,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};