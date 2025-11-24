// Ingredients API Service - Using centralized auth fetch utility

import { get, post, put, del } from './authFetch';

// Get ingredients
export const fetchIngredients = async (params = {}) => {
  console.log('API call: fetchIngredients', params);

  try {
    // Real API call to get ingredients:
    const response = await get(`/ingredients/paginated`, params);
    // Return the full response to access both data and pagination info
    return response;
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    throw error;
  }
};

// Create a new ingredient
export const createIngredient = async (ingredientData) => {
  console.log('API call: createIngredient', ingredientData);

  try {
    // Real API call:
    return await post('/ingredients', ingredientData);
  } catch (error) {
    console.error('Error creating ingredient:', error);
    throw error;
  }
};

// Update an existing ingredient
export const updateIngredient = async (id, ingredientData) => {
  console.log('API call: updateIngredient', id, ingredientData);

  try {
    // Real API call:
    return await put(`/ingredients/${id}`, ingredientData);
  } catch (error) {
    console.error('Error updating ingredient:', error);
    throw error;
  }
};

// Delete an ingredient
export const deleteIngredient = async (id) => {
  console.log('API call: deleteIngredient', id);

  try {
    // Real API call:
    return await del(`/ingredients/${id}`);
  } catch (error) {
    console.error('Error deleting ingredient:', error);
    throw error;
  }
};

// Search ingredients
export const searchIngredients = async (searchTerm, page = 1, limit = 10) => {
  console.log('API call: searchIngredients', searchTerm);

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
    console.error('Error searching ingredients:', error);
    throw error;
  }
};

// Get a single ingredient by ID
export const getIngredientById = async (id) => {
  console.log('API call: getIngredientById', id);

  try {
    // Real API call:
    const response = await get(`/ingredients/${id}`);
    // Return the ingredient data from the response
    return response.data || response;
  } catch (error) {
    console.error('Error getting ingredient by ID:', error);
    throw error;
  }
};

// Get ingredients by dish ID
export const getIngredientsByDishId = async (dishId) => {
  console.log('API call: getIngredientsByDishId', dishId);

  try {
    // Real API call: Get ingredients for a specific dish
    return await get(`/ingredients/by-dish/${dishId}`);
  } catch (error) {
    console.error('Error getting ingredients by dish ID:', error);
    throw error;
  }
};

// Get ingredients by place ID
export const getIngredientsByPlaceId = async (placeId, params = {}) => {
  console.log('API call: getIngredientsByPlaceId', placeId, params);

  try {
    // Real API call: Get ingredients filtered by place ID with pagination
    return await get(`/ingredients/search/place`, {
      place_id: placeId,
      ...params
    });
  } catch (error) {
    console.error('Error getting ingredients by place ID:', error);
    throw error;
  }
};

// Get ingredients by category ID
export const getIngredientsByCategoryId = async (categoryId, params = {}) => {
  console.log('API call: getIngredientsByCategoryId', categoryId, params);

  try {
    // Real API call: Get ingredients filtered by category ID with pagination
    return await get(`/ingredients/search/category`, {
      category_id: categoryId,
      ...params
    });
  } catch (error) {
    console.error('Error getting ingredients by category ID:', error);
    throw error;
  }
};

// Get ingredients by multiple filters
export const searchIngredientsAdvanced = async (filters = {}) => {
  console.log('API call: searchIngredientsAdvanced', filters);

  try {
    // Real API call: Get ingredients with multiple filters
    return await get(`/ingredients/search`, filters);
  } catch (error) {
    console.error('Error searching ingredients with advanced filters:', error);
    throw error;
  }
};