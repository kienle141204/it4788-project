// Centralized authentication fetch utility
// Handles authentication, token refresh, and common API request patterns

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090/api';
const API_BASE_URL = 'https://it4788-project-ttac.onrender.com/api';

// Main auth fetch function with token refresh logic
export const authFetch = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  // Get access token from localStorage
  const accessToken = localStorage.getItem('access_token');

  const config = {
    headers: {
      'Content-Type': 'application/json',
      // Add authentication header if token exists
      ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
    ...options,
  };

  try {
    console.log(`Making API request to: ${url}`, config);
    const response = await fetch(url, config);

    // If unauthorized, try to refresh token
    if (response.status === 401) {
      // Attempt to refresh token
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            // Update tokens in localStorage
            localStorage.setItem('access_token', refreshData.access_token);

            // Retry original request with new token
            config.headers['Authorization'] = `Bearer ${refreshData.access_token}`;
            const retryResponse = await fetch(url, config);

            if (!retryResponse.ok) {
              const errorData = await retryResponse.json().catch(() => ({}));
              let errorMessage = `API error: ${retryResponse.status}`;
              if (typeof errorData.message === 'string') {
                errorMessage = errorData.message;
              } else if (errorData.resultMessage?.vn) {
                errorMessage = errorData.resultMessage.vn;
              }
              throw new Error(errorMessage);
            }

            if (retryResponse.status === 204) {
              return null;
            }

            return await retryResponse.json();
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // If refresh fails, redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          throw refreshError;
        }
      } else {
        // No refresh token, redirect to login
        window.location.href = '/login';
        throw new Error('Authentication required');
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Ensure message is always a string
      let errorMessage = `API error: ${response.status}`;
      if (typeof errorData.message === 'string') {
        errorMessage = errorData.message;
      } else if (errorData.resultMessage?.vn) {
        errorMessage = errorData.resultMessage.vn;
      } else if (errorData.error) {
        errorMessage = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
      }
      throw new Error(errorMessage);
    }

    // For DELETE requests, we might not have response body
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed: ${url}`, error);
    throw error;
  }
};

// Helper functions for common HTTP methods
export const get = async (endpoint, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return await authFetch(queryString ? `${endpoint}?${queryString}` : endpoint, {
    method: 'GET'
  });
};

export const post = async (endpoint, data) => {
  return await authFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const put = async (endpoint, data) => {
  return await authFetch(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const del = async (endpoint) => {
  return await authFetch(endpoint, {
    method: 'DELETE'
  });
};

export const patch = async (endpoint, data) => {
  return await authFetch(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
};