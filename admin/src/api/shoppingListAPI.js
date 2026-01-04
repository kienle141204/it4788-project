// Shopping List API Service - Admin functions
import { get, post, patch, del } from './authFetch';

// Get all shopping lists (admin only)
export const fetchShoppingLists = async (params = {}) => {
    try {
        const response = await get('/shopping-lists', params);
        return response;
    } catch (error) {
        throw error;
    }
};

// Get shopping list by ID
export const getShoppingListById = async (id) => {
    try {
        const response = await get(`/shopping-lists/${id}`);
        return response.data || response;
    } catch (error) {
        throw error;
    }
};

// Create a new shopping list
export const createShoppingList = async (data) => {
    try {
        return await post('/shopping-lists', data);
    } catch (error) {
        throw error;
    }
};

// Update shopping list
export const updateShoppingList = async (id, data) => {
    try {
        return await patch(`/shopping-lists/${id}`, data);
    } catch (error) {
        throw error;
    }
};

// Delete shopping list
export const deleteShoppingList = async (id) => {
    try {
        return await del(`/shopping-lists/${id}`);
    } catch (error) {
        throw error;
    }
};

// Share shopping list with family
export const shareShoppingList = async (id) => {
    try {
        return await patch(`/shopping-lists/share/${id}`, {});
    } catch (error) {
        throw error;
    }
};

// Get family shared shopping lists
export const getFamilySharedLists = async (familyId) => {
    console.log('API call: getFamilySharedLists', familyId);
    try {
        const response = await get(`/shopping-lists/my-family-shared/${familyId}`);
        return response.data || response || [];
    } catch (error) {
        console.error('Error getting family shared lists:', error);
        throw error;
    }
};
