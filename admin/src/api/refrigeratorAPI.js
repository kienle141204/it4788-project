// Refrigerator API Service - Admin functions
import { get, post, patch, del } from './authFetch';

// Get all refrigerators (admin only)
export const fetchRefrigerators = async (params = {}) => {
    try {
        const response = await get('/fridge', params);
        return response;
    } catch (error) {
        throw error;
    }
};

// Get refrigerator by ID
export const getRefrigeratorById = async (id) => {
    try {
        const response = await get(`/fridge/${id}`);
        return response.data || response;
    } catch (error) {
        throw error;
    }
};

// Create a new refrigerator
export const createRefrigerator = async (data) => {
    try {
        return await post('/fridge', data);
    } catch (error) {
        throw error;
    }
};

// Update refrigerator
export const updateRefrigerator = async (id, data) => {
    try {
        return await patch(`/fridge/${id}`, data);
    } catch (error) {
        throw error;
    }
};

// Delete refrigerator
export const deleteRefrigerator = async (id) => {
    try {
        return await del(`/fridge/${id}`);
    } catch (error) {
        throw error;
    }
};

// Get dishes in refrigerator
export const getRefrigeratorDishes = async (refrigeratorId, params = {}) => {
    try {
        const response = await get(`/fridge/${refrigeratorId}/dishes`, params);
        return response;
    } catch (error) {
        throw error;
    }
};

// Get ingredients in refrigerator
export const getRefrigeratorIngredients = async (refrigeratorId, params = {}) => {
    try {
        const response = await get(`/fridge/${refrigeratorId}/ingredients`, params);
        return response;
    } catch (error) {
        throw error;
    }
};

// Add dish to refrigerator
export const addDishToRefrigerator = async (refrigeratorId, data) => {
    try {
        return await post(`/fridge/${refrigeratorId}/dishes`, data);
    } catch (error) {
        throw error;
    }
};

// Add ingredient to refrigerator
export const addIngredientToRefrigerator = async (refrigeratorId, data) => {
    try {
        return await post(`/fridge/${refrigeratorId}/ingredients`, data);
    } catch (error) {
        throw error;
    }
};

// Remove dish from refrigerator
export const removeDishFromRefrigerator = async (dishId) => {
    try {
        return await del(`/fridge/dishes/${dishId}`);
    } catch (error) {
        throw error;
    }
};

// Remove ingredient from refrigerator
export const removeIngredientFromRefrigerator = async (ingredientId) => {
    try {
        return await del(`/fridge/ingredients/${ingredientId}`);
    } catch (error) {
        throw error;
    }
};
