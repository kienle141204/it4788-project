// Dishes API Service - Using centralized auth fetch utility

import { get, post, put, del } from './authFetch';

// Get dishes with optional pagination and filtering
export const fetchDishes = async (params = {}) => {
  console.log('API call: fetchDishes', params);

  try {
    // Use paginated endpoint for better performance
    const response = await get(`/dishes/get-paginated`, params);
    // Return the full response to access both data and pagination info
    return response;
  } catch (error) {
    console.error('Error fetching dishes:', error);
    throw error;
  }
};

// Create a new dish
export const createDish = async (dishData) => {
  console.log('API call: createDish', dishData);

  try {
    // Note: Backend documentation doesn't show a direct dish creation endpoint
    // This functionality may not be available in the backend
    throw new Error('Dish creation endpoint not available in backend');
  } catch (error) {
    console.error('Error creating dish:', error);
    throw error;
  }
};

// Update an existing dish
export const updateDish = async (id, dishData) => {
  console.log('API call: updateDish', id, dishData);

  try {
    // Note: Backend documentation doesn't show a direct dish update endpoint
    // This functionality may not be available in the backend
    throw new Error('Dish update endpoint not available in backend');
  } catch (error) {
    console.error('Error updating dish:', error);
    throw error;
  }
};

// Delete a dish
export const deleteDish = async (id) => {
  console.log('API call: deleteDish', id);

  try {
    // Note: Backend documentation doesn't show a direct dish delete endpoint
    // This functionality may not be available in the backend
    throw new Error('Dish delete endpoint not available in backend');
  } catch (error) {
    console.error('Error deleting dish:', error);
    throw error;
  }
};

// Search dishes
export const searchDishes = async (searchTerm, page = 1, limit = 10) => {
  console.log('API call: searchDishes', searchTerm);

  try {
    // Use the search endpoint with pagination
    const response = await get(`/dishes/search-paginated`, {
      name: searchTerm,
      page: page,
      limit: limit
    });
    // Return the full response to access both data and pagination info
    return response;
  } catch (error) {
    console.error('Error searching dishes:', error);
    throw error;
  }
};

// Get a single dish by ID
export const getDishById = async (id) => {
  console.log('API call: getDishById', id);

  try {
    // Use the correct endpoint for getting dish by ID based on backend documentation
    const response = await get(`/dishes/get-info-dish-by-id/${id}`);
    // Return the dish data from the response
    return response.data || response;
  } catch (error) {
    console.error('Error getting dish by ID:', error);
    throw error;
  }
};

// Get all dish info (non-paginated)
export const getAllDishes = async () => {
  console.log('API call: getAllDishes');

  try {
    // Use the get-all-info-dish endpoint for getting all dishes
    const response = await get(`/dishes/get-all-info-dish`);
    // Return the full response
    return response;
  } catch (error) {
    console.error('Error getting all dishes:', error);
    throw error;
  }
};