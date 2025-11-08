// Foods API Service - API placeholders for you to add real API endpoints

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

// Get foods with optional pagination and filtering
export const fetchFoods = async (params = {}) => {
  // TODO: Replace with your actual API endpoint
  console.log('API call: fetchFoods', params);
  
  try {
    // Uncomment the following when you have real API:
    // return await makeApiRequest(`/foods?${new URLSearchParams(params)}`);
    
    // Mock response - replace with real API
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      data: [
        { id: 1, name: 'Thịt ba chỉ', category: 'Thịt', quantity: '500g', calories: '250', expiryDate: '2024-12-31' },
        { id: 2, name: 'Cá basa', category: 'Cá', quantity: '300g', calories: '180', expiryDate: '2024-11-20' },
      ],
      total: 2,
      page: 1,
      limit: 10
    };
  } catch (error) {
    console.error('Error fetching foods:', error);
    throw error;
  }
};

// Create a new food
export const createFood = async (foodData) => {
  // TODO: Replace with your actual API endpoint
  // Example: return await makeApiRequest('/foods', {
  //   method: 'POST',
  //   body: JSON.stringify(foodData)
  // })
  console.log('API call: createFood', foodData);
  
  try {
    // Uncomment the following when you have real API:
    // return await makeApiRequest('/foods', {
    //   method: 'POST',
    //   body: JSON.stringify(foodData)
    // });
    
    // Mock response - replace with real API
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      id: Date.now(), // Mock ID
      ...foodData
    };
  } catch (error) {
    console.error('Error creating food:', error);
    throw error;
  }
};

// Update an existing food
export const updateFood = async (id, foodData) => {
  // TODO: Replace with your actual API endpoint
  // Example: return await makeApiRequest(`/foods/${id}`, {
  //   method: 'PUT',
  //   body: JSON.stringify(foodData)
  // })
  console.log('API call: updateFood', id, foodData);
  
  try {
    // Uncomment the following when you have real API:
    // return await makeApiRequest(`/foods/${id}`, {
    //   method: 'PUT',
    //   body: JSON.stringify(foodData)
    // });
    
    // Mock response - replace with real API
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      id: parseInt(id),
      ...foodData
    };
  } catch (error) {
    console.error('Error updating food:', error);
    throw error;
  }
};

// Delete a food
export const deleteFood = async (id) => {
  // TODO: Replace with your actual API endpoint
  // Example: return await makeApiRequest(`/foods/${id}`, { method: 'DELETE' })
  console.log('API call: deleteFood', id);
  
  try {
    // Uncomment the following when you have real API:
    // return await makeApiRequest(`/foods/${id}`, { method: 'DELETE' });
    
    // Mock response - replace with real API
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { success: true, id };
  } catch (error) {
    console.error('Error deleting food:', error);
    throw error;
  }
};

// Search foods
export const searchFoods = async (searchTerm) => {
  // TODO: Replace with your actual API endpoint
  console.log('API call: searchFoods', searchTerm);
  
  try {
    // Uncomment the following when you have real API:
    // return await makeApiRequest(`/foods/search?q=${encodeURIComponent(searchTerm)}`);
    
    // Mock response - replace with real API
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      data: [
        { id: 1, name: 'Thịt ba chỉ', category: 'Thịt', quantity: '500g', calories: '250', expiryDate: '2024-12-31' },
        { id: 2, name: 'Cá basa', category: 'Cá', quantity: '300g', calories: '180', expiryDate: '2024-11-20' },
      ],
      total: 2,
      page: 1,
      limit: 10
    };
  } catch (error) {
    console.error('Error searching foods:', error);
    throw error;
  }
};

// Get a single food by ID
export const getFoodById = async (id) => {
  // TODO: Replace with your actual API endpoint
  console.log('API call: getFoodById', id);
  
  try {
    // Uncomment the following when you have real API:
    // return await makeApiRequest(`/foods/${id}`);
    
    // Mock response - replace with real API
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      id: parseInt(id),
      name: 'Thịt ba chỉ',
      category: 'Thịt',
      quantity: '500g',
      calories: '250',
      expiryDate: '2024-12-31'
    };
  } catch (error) {
    console.error('Error getting food by ID:', error);
    throw error;
  }
};