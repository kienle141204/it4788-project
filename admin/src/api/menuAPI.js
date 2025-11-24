// Menu API Service - Using centralized auth fetch utility

import { get, post, put, del } from './authFetch';

// Get menus with optional pagination and filtering
export const fetchMenus = async (params = {}) => {
  console.log('API call: fetchMenus', params);

  try {
    // Use the menus endpoint with pagination support
    const response = await get(`/menus`, params);
    // Return the full response to access both data and pagination info
    return response;
  } catch (error) {
    console.error('Error fetching menus:', error);
    throw error;
  }
};

// Create a new menu
export const createMenu = async (menuData) => {
  console.log('API call: createMenu', menuData);

  try {
    return await post('/menus', menuData);
  } catch (error) {
    console.error('Error creating menu:', error);
    throw error;
  }
};

// Update an existing menu
export const updateMenu = async (id, menuData) => {
  console.log('API call: updateMenu', id, menuData);

  try {
    return await put(`/menus/${id}`, menuData);
  } catch (error) {
    console.error('Error updating menu:', error);
    throw error;
  }
};

// Delete a menu
export const deleteMenu = async (id) => {
  console.log('API call: deleteMenu', id);

  try {
    return await del(`/menus/${id}`);
  } catch (error) {
    console.error('Error deleting menu:', error);
    throw error;
  }
};

// Search menus
export const searchMenus = async (searchTerm, page = 1, limit = 10) => {
  console.log('API call: searchMenus', searchTerm);

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
    console.error('Error searching menus:', error);
    throw error;
  }
};

// Get a single menu by ID
export const getMenuById = async (id) => {
  console.log('API call: getMenuById', id);

  try {
    const response = await get(`/menus/${id}`);
    // Return the menu data from the response
    return response.data || response;
  } catch (error) {
    console.error('Error getting menu by ID:', error);
    throw error;
  }
};

// Add dish to menu
export const addDishToMenu = async (menuId, dishData) => {
  console.log('API call: addDishToMenu', menuId, dishData);

  try {
    // Based on documentation: http://localhost:8090/api/menus/1/dishes
    return await post(`/menus/${menuId}/dishes`, dishData);
  } catch (error) {
    console.error('Error adding dish to menu:', error);
    throw error;
  }
};

// Remove dish from menu
export const removeDishFromMenu = async (menuId, dishId) => {
  console.log('API call: removeDishFromMenu', menuId, dishId);

  try {
    // Use DELETE method to remove a dish from menu
    // Backend uses dishId in the URL for removal
    return await del(`/menus/${menuId}/dishes/${dishId}`);
  } catch (error) {
    console.error('Error removing dish from menu:', error);
    throw error;
  }
};

// Get menu dishes
export const getMenuDishes = async (menuId) => {
  console.log('API call: getMenuDishes', menuId);

  try {
    // Get dishes for a specific menu
    return await get(`/menus/${menuId}/dishes`);
  } catch (error) {
    console.error('Error getting menu dishes:', error);
    throw error;
  }
};