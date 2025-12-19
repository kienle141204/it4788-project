// Refrigerator API Service - Admin functions
import { get, post, patch, del } from './authFetch';

// Get all refrigerators (admin only)
export const fetchRefrigerators = async (params = {}) => {
    console.log('API call: fetchRefrigerators', params);
    try {
        const response = await get('/fridge', params);
        return response;
    } catch (error) {
        console.error('Error fetching refrigerators:', error);
        throw error;
    }
};

// Get refrigerator by ID
export const getRefrigeratorById = async (id) => {
    console.log('API call: getRefrigeratorById', id);
    try {
        const response = await get(`/fridge/${id}`);
        return response.data || response;
    } catch (error) {
        console.error('Error getting refrigerator by ID:', error);
        throw error;
    }
};

// Create a new refrigerator
export const createRefrigerator = async (data) => {
    console.log('API call: createRefrigerator', data);
    try {
        return await post('/fridge', data);
    } catch (error) {
        console.error('Error creating refrigerator:', error);
        throw error;
    }
};

// Update refrigerator
export const updateRefrigerator = async (id, data) => {
    console.log('API call: updateRefrigerator', id, data);
    try {
        return await patch(`/fridge/${id}`, data);
    } catch (error) {
        console.error('Error updating refrigerator:', error);
        throw error;
    }
};

// Delete refrigerator
export const deleteRefrigerator = async (id) => {
    console.log('API call: deleteRefrigerator', id);
    try {
        return await del(`/fridge/${id}`);
    } catch (error) {
        console.error('Error deleting refrigerator:', error);
        throw error;
    }
};

// Get dishes in refrigerator
export const getRefrigeratorDishes = async (refrigeratorId, params = {}) => {
    console.log('API call: getRefrigeratorDishes', refrigeratorId, params);
    try {
        const response = await get(`/fridge/${refrigeratorId}/dishes`, params);
        return response;
    } catch (error) {
        console.error('Error getting refrigerator dishes:', error);
        throw error;
    }
};

// Get ingredients in refrigerator
export const getRefrigeratorIngredients = async (refrigeratorId, params = {}) => {
    console.log('API call: getRefrigeratorIngredients', refrigeratorId, params);
    try {
        const response = await get(`/fridge/${refrigeratorId}/ingredients`, params);
        return response;
    } catch (error) {
        console.error('Error getting refrigerator ingredients:', error);
        throw error;
    }
};

// Add dish to refrigerator
export const addDishToRefrigerator = async (refrigeratorId, data) => {
    console.log('API call: addDishToRefrigerator', refrigeratorId, data);
    try {
        return await post(`/fridge/${refrigeratorId}/dishes`, data);
    } catch (error) {
        console.error('Error adding dish to refrigerator:', error);
        throw error;
    }
};

// Add ingredient to refrigerator
export const addIngredientToRefrigerator = async (refrigeratorId, data) => {
    console.log('API call: addIngredientToRefrigerator', refrigeratorId, data);
    try {
        return await post(`/fridge/${refrigeratorId}/ingredients`, data);
    } catch (error) {
        console.error('Error adding ingredient to refrigerator:', error);
        throw error;
    }
};

// Remove dish from refrigerator
export const removeDishFromRefrigerator = async (dishId) => {
    console.log('API call: removeDishFromRefrigerator', dishId);
    try {
        return await del(`/fridge/dishes/${dishId}`);
    } catch (error) {
        console.error('Error removing dish from refrigerator:', error);
        throw error;
    }
};

// Remove ingredient from refrigerator
export const removeIngredientFromRefrigerator = async (ingredientId) => {
    console.log('API call: removeIngredientFromRefrigerator', ingredientId);
    try {
        return await del(`/fridge/ingredients/${ingredientId}`);
    } catch (error) {
        console.error('Error removing ingredient from refrigerator:', error);
        throw error;
    }
};
