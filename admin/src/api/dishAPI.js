// Dishes API Service - Using centralized auth fetch utility

import { get, post, put, del } from './authFetch';

// Get dishes with optional pagination and filtering
export const fetchDishes = async (params = {}) => {
  console.log('API call: fetchDishes', params);
  
  try {
    // Real API call:
    return await get(`/dishes`, params);
  } catch (error) {
    console.error('Error fetching dishes:', error);
    throw error;
  }
};

// Create a new dish
export const createDish = async (dishData) => {
  console.log('API call: createDish', dishData);
  
  try {
    // Real API call:
    return await post('/dishes', dishData);
  } catch (error) {
    console.error('Error creating dish:', error);
    throw error;
  }
};

// Update an existing dish
export const updateDish = async (id, dishData) => {
  console.log('API call: updateDish', id, dishData);
  
  try {
    // Real API call:
    return await put(`/dishes/${id}`, dishData);
  } catch (error) {
    console.error('Error updating dish:', error);
    throw error;
  }
};

// Delete a dish
export const deleteDish = async (id) => {
  console.log('API call: deleteDish', id);
  
  try {
    // Real API call:
    return await del(`/dishes/${id}`);
  } catch (error) {
    console.error('Error deleting dish:', error);
    throw error;
  }
};

// Search dishes
export const searchDishes = async (searchTerm) => {
  console.log('API call: searchDishes', searchTerm);
  
  try {
    // Real API call:
    return await get(`/dishes/search`, { q: searchTerm });
  } catch (error) {
    console.error('Error searching dishes:', error);
    throw error;
  }
};

// Get a single dish by ID
export const getDishById = async (id) => {
  console.log('API call: getDishById', id);
  
  try {
    // Real API call:
    return await get(`/dishes/${id}`);
  } catch (error) {
    console.error('Error getting dish by ID:', error);
    throw error;
  }
};