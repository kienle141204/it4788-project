// Ingredients API Service - Using centralized auth fetch utility

import { get, post, put, del } from './authFetch';

// Get ingredients 
export const fetchIngredients = async (params = {}) => {
  console.log('API call: fetchIngredients', params);

  try {
    // Real API call to get ingredients:
    return await get(`/ingredients`, params);
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
export const searchIngredients = async (searchTerm) => {
  console.log('API call: searchIngredients', searchTerm);

  try {
    // Real API call:
    return await get(`/ingredients/search/name`, { name: searchTerm });
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
    return await get(`/ingredients/${id}`);
  } catch (error) {
    console.error('Error getting ingredient by ID:', error);
    throw error;
  }
};