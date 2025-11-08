// Dishes API Service - API placeholders for you to add real API endpoints

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

// Get dishes with optional pagination and filtering
export const fetchDishes = async (params = {}) => {
  console.log('API call: fetchDishes', params);
  
  try {
    // Real API call:
    return await makeApiRequest(`/dishes?${new URLSearchParams(params)}`);
  } catch (error) {
    console.error('Error fetching dishes:', error);
    throw error;
  }
};

// Create a new dish
export const createDish = async (dishData) => {
  // TODO: Replace with your actual API endpoint
  // Example: return await makeApiRequest('/dishes', {
  //   method: 'POST',
  //   body: JSON.stringify(dishData)
  // })
  console.log('API call: createDish', dishData);
  
  try {
    // Uncomment the following when you have real API:
    // return await makeApiRequest('/dishes', {
    //   method: 'POST',
    //   body: JSON.stringify(dishData)
    // });
    
    // Mock response - replace with real API
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      id: Date.now(), // Mock ID
      ...dishData
    };
  } catch (error) {
    console.error('Error creating dish:', error);
    throw error;
  }
};

// Update an existing dish
export const updateDish = async (id, dishData) => {
  // TODO: Replace with your actual API endpoint
  // Example: return await makeApiRequest(`/dishes/${id}`, {
  //   method: 'PUT',
  //   body: JSON.stringify(dishData)
  // })
  console.log('API call: updateDish', id, dishData);
  
  try {
    // Uncomment the following when you have real API:
    // return await makeApiRequest(`/dishes/${id}`, {
    //   method: 'PUT',
    //   body: JSON.stringify(dishData)
    // });
    
    // Mock response - replace with real API
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      id: parseInt(id),
      ...dishData
    };
  } catch (error) {
    console.error('Error updating dish:', error);
    throw error;
  }
};

// Delete a dish
export const deleteDish = async (id) => {
  // TODO: Replace with your actual API endpoint
  // Example: return await makeApiRequest(`/dishes/${id}`, { method: 'DELETE' })
  console.log('API call: deleteDish', id);
  
  try {
    // Uncomment the following when you have real API:
    // return await makeApiRequest(`/dishes/${id}`, { method: 'DELETE' });
    
    // Mock response - replace with real API
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { success: true, id };
  } catch (error) {
    console.error('Error deleting dish:', error);
    throw error;
  }
};

// Search dishes
export const searchDishes = async (searchTerm) => {
  // TODO: Replace with your actual API endpoint
  console.log('API call: searchDishes', searchTerm);
  
  try {
    // Uncomment the following when you have real API:
    // return await makeApiRequest(`/dishes/search?q=${encodeURIComponent(searchTerm)}`);
    
    // Mock response - replace with real API
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      data: [
        { id: 1, name: 'Thịt kho tàu', category: 'Món mặn', servings: '4', cookTime: '45', difficulty: 'Trung bình' },
        { id: 2, name: 'Canh chua cá', category: 'Canh', servings: '4', cookTime: '30', difficulty: 'Dễ' },
      ],
      total: 2,
      page: 1,
      limit: 10
    };
  } catch (error) {
    console.error('Error searching dishes:', error);
    throw error;
  }
};

// Get a single dish by ID
export const getDishById = async (id) => {
  // TODO: Replace with your actual API endpoint
  console.log('API call: getDishById', id);
  
  try {
    // Uncomment the following when you have real API:
    // return await makeApiRequest(`/dishes/${id}`);
    
    // Mock response - replace with real API
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      id: parseInt(id),
      name: 'Thịt kho tàu',
      category: 'Món mặn',
      servings: '4',
      cookTime: '45',
      difficulty: 'Trung bình'
    };
  } catch (error) {
    console.error('Error getting dish by ID:', error);
    throw error;
  }
};