// Foods API Service - Using centralized auth fetch utility

import { get, post, put, del } from './authFetch';

// Get foods with optional pagination and filtering
export const fetchFoods = async (params = {}) => {
  console.log('API call: fetchFoods', params);
  
  try {
    // Real API call:
    return await get(`/foods`, params);
  } catch (error) {
    console.error('Error fetching foods:', error);
    throw error;
  }
};

// Create a new food
export const createFood = async (foodData) => {
  console.log('API call: createFood', foodData);
  
  try {
    // Real API call:
    return await post('/foods', foodData);
  } catch (error) {
    console.error('Error creating food:', error);
    throw error;
  }
};

// Update an existing food
export const updateFood = async (id, foodData) => {
  console.log('API call: updateFood', id, foodData);
  
  try {
    // Real API call:
    return await put(`/foods/${id}`, foodData);
  } catch (error) {
    console.error('Error updating food:', error);
    throw error;
  }
};

// Delete a food
export const deleteFood = async (id) => {
  console.log('API call: deleteFood', id);
  
  try {
    // Real API call:
    return await del(`/foods/${id}`);
  } catch (error) {
    console.error('Error deleting food:', error);
    throw error;
  }
};

// Search foods
export const searchFoods = async (searchTerm) => {
  console.log('API call: searchFoods', searchTerm);
  
  try {
    // Real API call:
    return await get(`/foods/search`, { q: searchTerm });
  } catch (error) {
    console.error('Error searching foods:', error);
    throw error;
  }
};

// Get a single food by ID
export const getFoodById = async (id) => {
  console.log('API call: getFoodById', id);
  
  try {
    // Real API call:
    return await get(`/foods/${id}`);
  } catch (error) {
    console.error('Error getting food by ID:', error);
    throw error;
  }
};