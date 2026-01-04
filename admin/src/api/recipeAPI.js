// Recipes API Service - Using centralized auth fetch utility

import { get, post, put, del } from './authFetch';

// Get recipes with optional pagination and filtering
export const fetchRecipes = async (params = {}) => {

  try {
    // Real API call with pagination support:
    const response = await get(`/recipes`, params);
    // Return both data and pagination info for the component to use
    return response;
  } catch (error) {
    throw error;
  }
};

// Create a new recipe
export const createRecipe = async (recipeData) => {

  try {
    // Real API call:
    return await post('/recipes', recipeData);
  } catch (error) {
    throw error;
  }
};

// Update an existing recipe
export const updateRecipe = async (id, recipeData) => {

  try {
    // Real API call - PUT /recipes/:id
    const response = await put(`/recipes/${id}`, recipeData);
    // Return the recipe data from the response
    return response.data || response;
  } catch (error) {
    throw error;
  }
};

// Delete a recipe
export const deleteRecipe = async (id) => {

  try {
    // Real API call - DELETE /recipes/:id
    const response = await del(`/recipes/${id}`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Search recipes - Note: Backend doesn't have a specific search endpoint for recipes
// So we'll use filtering with the main endpoint
export const searchRecipes = async (searchTerm, page = 1, limit = 10) => {

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
    throw error;
  }
};

// Get a single recipe by ID
export const getRecipeById = async (id) => {

  try {
    // According to backend documentation
    const response = await get(`/recipes/${id}`);
    // Return the recipe data from the response
    return response.data || response;
  } catch (error) {
    throw error;
  }
};

// Get recipes by dish ID
export const getRecipesByDishId = async (dishId) => {

  try {
    // According to docs, this endpoint may not exist in backend, so we'll use the main recipes endpoint with filter
    return await get(`/recipes`, { dishId });
  } catch (error) {
    throw error;
  }
};

// Get recipes by owner ID
export const getRecipesByOwnerId = async (ownerId) => {

  try {
    // According to docs, this endpoint may not exist in backend, so we'll use the main recipes endpoint with filter
    return await get(`/recipes`, { ownerId });
  } catch (error) {
    throw error;
  }
};

// Get popular recipes
export const getPopularRecipes = async (limit = 10) => {

  try {
    // According to docs, this endpoint may not exist in backend, so we'll use the main recipes endpoint with sort
    return await get(`/recipes`, { limit, sortBy: 'popularity' });
  } catch (error) {
    throw error;
  }
};

