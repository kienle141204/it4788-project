// Recipes API Service - Using centralized auth fetch utility

import { get, post, put, del } from './authFetch';

// Get recipes with optional pagination and filtering
export const fetchRecipes = async (params = {}) => {
  console.log('API call: fetchRecipes', params);
  
  try {
    // Real API call:
    return await get(`/recipes`, params);
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
    // Real API call:
    return await put(`/recipes/${id}`, recipeData);
  } catch (error) {
    console.error('Error updating recipe:', error);
    throw error;
  }
};

// Delete a recipe
export const deleteRecipe = async (id) => {
  console.log('API call: deleteRecipe', id);
  
  try {
    // Real API call:
    return await del(`/recipes/${id}`);
  } catch (error) {
    console.error('Error deleting recipe:', error);
    throw error;
  }
};

// Search recipes
export const searchRecipes = async (searchTerm) => {
  console.log('API call: searchRecipes', searchTerm);
  
  try {
    // Real API call:
    return await get(`/recipes/search`, { q: searchTerm });
  } catch (error) {
    console.error('Error searching recipes:', error);
    throw error;
  }
};

// Get a single recipe by ID
export const getRecipeById = async (id) => {
  console.log('API call: getRecipeById', id);
  
  try {
    // Real API call:
    return await get(`/recipes/${id}`);
  } catch (error) {
    console.error('Error getting recipe by ID:', error);
    throw error;
  }
};