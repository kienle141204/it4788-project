// Dishes API Service - Using centralized auth fetch utility

import { get, post, del } from './authFetch';

// Get dishes with optional pagination and filtering
export const fetchDishes = async (params = {}) => {

  try {
    // Use paginated endpoint for better performance
    const response = await get(`/dishes/get-paginated`, params);
    // Return the full response to access both data and pagination info
    return response;
  } catch (error) {
    throw error;
  }
};

// Create a new dish
export const createDish = async (dishData) => {

  try {
    const response = await post('/dishes/create-dish', dishData);
    return response.data || response;
  } catch (error) {
    throw error;
  }
};

// Update an existing dish - NOT SUPPORTED BY BACKEND
export const updateDish = async (id, dishData) => {
  throw new Error('Chức năng sửa món ăn chưa được hỗ trợ bởi backend');
};

// Delete a dish - NOT SUPPORTED BY BACKEND  
export const deleteDish = async (id) => {
  throw new Error('Chức năng xóa món ăn chưa được hỗ trợ bởi backend');
};

// Search dishes
export const searchDishes = async (searchTerm, page = 1, limit = 10) => {

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
    throw error;
  }
};

// Get a single dish by ID
export const getDishById = async (id) => {

  try {
    // Use the correct endpoint for getting dish by ID based on backend documentation
    const response = await get(`/dishes/get-info-dish-by-id/${id}`);
    // Return the dish data from the response
    return response.data || response;
  } catch (error) {
    throw error;
  }
};

// Get all dish info (non-paginated)
export const getAllDishes = async () => {

  try {
    // Use the get-all-info-dish endpoint for getting all dishes
    const response = await get(`/dishes/get-all-info-dish`);
    // Return the full response
    return response;
  } catch (error) {
    throw error;
  }
};
