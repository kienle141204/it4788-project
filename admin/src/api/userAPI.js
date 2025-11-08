// User API Service - API placeholders for you to add real API endpoints

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090/api'; // Use environment variable if available

// Helper function to make authenticated API requests
const makeApiRequest = async (endpoint, options = {}) => {
  // Get access token from localStorage
  const accessToken = localStorage.getItem('access_token');
  
  const url = `${API_BASE_URL}${endpoint}`;
  
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
          const refreshResponse = await fetch('http://localhost:8090/api/auth/refresh', {
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
              throw new Error(errorData.message || `API error: ${retryResponse.status}`);
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
      throw new Error(errorData.message || `API error: ${response.status}`);
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

// Get users with optional pagination and filtering
export const fetchUsers = async (params = {}) => {
  console.log('API call: fetchUsers', params);
  
  try {
    // Real API call:
    return await makeApiRequest(`/users?${new URLSearchParams(params)}`);
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Create a new user
export const createUser = async (userData) => {
  console.log('API call: createUser', userData);
  
  try {
    // Real API call:
    return await makeApiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Update an existing user
export const updateUser = async (id, userData) => {
  console.log('API call: updateUser', id, userData);
  
  try {
    // Real API call:
    return await makeApiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Delete a user
export const deleteUser = async (id) => {
  console.log('API call: deleteUser', id);
  
  try {
    // Real API call:
    return await makeApiRequest(`/users/${id}`, { method: 'DELETE' });
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Search users
export const searchUsers = async (searchTerm) => {
  console.log('API call: searchUsers', searchTerm);
  
  try {
    // Real API call:
    return await makeApiRequest(`/users/search?q=${encodeURIComponent(searchTerm)}`);
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

// Get a single user by ID
export const getUserById = async (id) => {
  console.log('API call: getUserById', id);
  
  try {
    // Real API call:
    return await makeApiRequest(`/users/${id}`);
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
};