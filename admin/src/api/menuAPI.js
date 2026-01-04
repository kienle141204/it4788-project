// Menu API Service - Using centralized auth fetch utility

import { get, post, put, del } from './authFetch';

// Get menus with optional pagination and filtering
export const fetchMenus = async (params = {}) => {

  try {
    // Use the menus endpoint with pagination support
    const response = await get(`/menus`, params);
    // Return the full response to access both data and pagination info
    return response;
  } catch (error) {
    throw error;
  }
};

// Create a new menu
export const createMenu = async (menuData) => {

  try {
    return await post('/menus', menuData);
  } catch (error) {
    throw error;
  }
};

// Update an existing menu
export const updateMenu = async (id, menuData) => {

  try {
    return await put(`/menus/${id}`, menuData);
  } catch (error) {
    throw error;
  }
};

// Delete a menu
export const deleteMenu = async (id) => {

  try {
    return await del(`/menus/${id}`);
  } catch (error) {
    throw error;
  }
};

// Search menus
export const searchMenus = async (searchTerm, page = 1, limit = 10) => {

  try {
    // For menu search, we may need to filter by description or family name
    const response = await get(`/menus`, {
      q: searchTerm,
      page: page,
      limit: limit
    });
    // Return the full response to access both data and pagination info
    return response;
  } catch (error) {
    throw error;
  }
};

// Get a single menu by ID
export const getMenuById = async (id) => {

  try {
    const response = await get(`/menus/${id}`);
    // Return the menu data from the response
    return response.data || response;
  } catch (error) {
    throw error;
  }
};

// Add dish to menu
export const addDishToMenu = async (menuId, dishData) => {

  try {
    // Based on documentation: http://localhost:8090/api/menus/1/dishes
    return await post(`/menus/${menuId}/dishes`, dishData);
  } catch (error) {
    throw error;
  }
};

// Remove dish from menu
export const removeDishFromMenu = async (menuId, dishId) => {

  try {
    // Use DELETE method to remove a dish from menu
    // Backend uses dishId in the URL for removal
    return await del(`/menus/${menuId}/dishes/${dishId}`);
  } catch (error) {
    throw error;
  }
};

// Get menu dishes
export const getMenuDishes = async (menuId) => {

  try {
    // Get dishes for a specific menu
    return await get(`/menus/${menuId}/dishes`);
  } catch (error) {
    throw error;
  }
};
