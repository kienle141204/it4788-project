// Ingredients API Service - Using centralized auth fetch utility

import { get, post } from './authFetch';

// Get ingredients
export const fetchIngredients = async (params = {}) => {

  try {
    // Real API call to get ingredients:
    const response = await get(`/ingredients/paginated`, params);
    // Return the full response to access both data and pagination info
    return response;
  } catch (error) {
    throw error;
  }
};

// Create a new ingredient
export const createIngredient = async (ingredientData) => {

  try {
    // Real API call:
    return await post('/ingredients', ingredientData);
  } catch (error) {
    throw error;
  }
};

// Update an existing ingredient - NOT SUPPORTED BY BACKEND
export const updateIngredient = async (id, ingredientData) => {
  throw new Error('Chức năng sửa nguyên liệu chưa được hỗ trợ bởi backend');
};

// Delete an ingredient - NOT SUPPORTED BY BACKEND
export const deleteIngredient = async (id) => {
  throw new Error('Chức năng xóa nguyên liệu chưa được hỗ trợ bởi backend');
};

// Search ingredients
export const searchIngredients = async (searchTerm, page = 1, limit = 10) => {

  try {
    // Real API call with pagination:
    const response = await get(`/ingredients/search/name`, {
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

// Get a single ingredient by ID
export const getIngredientById = async (id) => {

  try {
    // Real API call:
    const response = await get(`/ingredients/${id}`);
    // Return the ingredient data from the response
    return response.data || response;
  } catch (error) {
    throw error;
  }
};

// Get ingredients by dish ID
export const getIngredientsByDishId = async (dishId) => {

  try {
    // Real API call: Get ingredients for a specific dish
    return await get(`/ingredients/by-dish/${dishId}`);
  } catch (error) {
    throw error;
  }
};

// Get ingredients by place ID
export const getIngredientsByPlaceId = async (placeId, params = {}) => {

  try {
    // Real API call: Get ingredients filtered by place ID with pagination
    return await get(`/ingredients/search/place`, {
      place_id: placeId,
      ...params
    });
  } catch (error) {
    throw error;
  }
};

// Get ingredients by category ID
export const getIngredientsByCategoryId = async (categoryId, params = {}) => {

  try {
    // Real API call: Get ingredients filtered by category ID with pagination
    return await get(`/ingredients/search/category`, {
      category_id: categoryId,
      ...params
    });
  } catch (error) {
    throw error;
  }
};

// Get ingredients by multiple filters
export const searchIngredientsAdvanced = async (filters = {}) => {

  try {
    // Real API call: Get ingredients with multiple filters
    return await get(`/ingredients/search`, filters);
  } catch (error) {
    throw error;
  }
};
