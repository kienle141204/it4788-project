// Recipes API Service - Using centralized auth fetch utility

import { get, post, put, del } from './authFetch';

// Get recipes with optional pagination and filtering
export const fetchRecipes = async (params = {}) => {
  console.log('API call: fetchRecipes', params);

  try {
    // Real API call with pagination support:
    const response = await get(`/recipes`, params);
    // Return both data and pagination info for the component to use
    return response;
  } catch (error) {
    console.error('Error fetching recipes:', error);
    throw error;
  }
};

// Create a new recipe
export const createRecipe = async (recipeData) => {
  console.log('API call: createRecipe', recipeData);

  try {
    // Real API call:
    return await post('/recipes', recipeData);
  } catch (error) {
    console.error('Error creating recipe:', error);
    throw error;
  }
};

// Update an existing recipe
export const updateRecipe = async (id, recipeData) => {
  console.log('API call: updateRecipe', id, recipeData);

  try {
    // Real API call - PUT /recipes/:id
    const response = await put(`/recipes/${id}`, recipeData);
    // Return the recipe data from the response
    return response.data || response;
  } catch (error) {
    console.error('Error updating recipe:', error);
    throw error;
  }
};

// Delete a recipe
export const deleteRecipe = async (id) => {
  console.log('API call: deleteRecipe', id);

  try {
    // Real API call - DELETE /recipes/:id
    const response = await del(`/recipes/${id}`);
    return response;
  } catch (error) {
    console.error('Error deleting recipe:', error);
    throw error;
  }
};

// Search recipes - Note: Backend doesn't have a specific search endpoint for recipes
// So we'll use filtering with the main endpoint
export const searchRecipes = async (searchTerm, page = 1, limit = 10) => {
  console.log('API call: searchRecipes', searchTerm);

  try {
    // According to backend documentation, there's no dedicated search endpoint
    // Using general recipes endpoint with filters
    const response = await get(`/recipes`, {
      q: searchTerm,
      page: page,
      limit: limit
    });
    // Return both data and pagination info for the component to use
    return response;
  } catch (error) {
    console.error('Error searching recipes:', error);
    throw error;
  }
};

// Get a single recipe by ID
export const getRecipeById = async (id) => {
  console.log('API call: getRecipeById', id);

  try {
    // According to backend documentation
    const response = await get(`/recipes/${id}`);
    // Return the recipe data from the response
    return response.data || response;
  } catch (error) {
    console.error('Error getting recipe by ID:', error);
    throw error;
  }
};

// Get recipes by dish ID
export const getRecipesByDishId = async (dishId) => {
  console.log('API call: getRecipesByDishId', dishId);

  try {
    // According to docs, this endpoint may not exist in backend, so we'll use the main recipes endpoint with filter
    return await get(`/recipes`, { dishId });
  } catch (error) {
    console.error('Error getting recipes by dish ID:', error);
    throw error;
  }
};

// Get recipes by owner ID
export const getRecipesByOwnerId = async (ownerId) => {
  console.log('API call: getRecipesByOwnerId', ownerId);

  try {
    // According to docs, this endpoint may not exist in backend, so we'll use the main recipes endpoint with filter
    return await get(`/recipes`, { ownerId });
  } catch (error) {
    console.error('Error getting recipes by owner ID:', error);
    throw error;
  }
};

// Get popular recipes
export const getPopularRecipes = async (limit = 10) => {
  console.log('API call: getPopularRecipes', limit);

  try {
    // According to docs, this endpoint may not exist in backend, so we'll use the main recipes endpoint with sort
    return await get(`/recipes`, { limit, sortBy: 'popularity' });
  } catch (error) {
    console.error('Error getting popular recipes:', error);
    throw error;
  }
};

