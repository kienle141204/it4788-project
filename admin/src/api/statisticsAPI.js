// Shopping Statistics API Service
import { get } from './authFetch';

// Get total cost by month
export const getMonthlyCost = async (year, familyId) => {
    console.log('API call: getMonthlyCost', year, familyId);
    try {
        const response = await get('/shopping-statistics/monthly-cost', { year, familyId });
        return response;
    } catch (error) {
        console.error('Error getting monthly cost:', error);
        throw error;
    }
};

// Get checked items count
export const getCheckedItems = async (familyId) => {
    console.log('API call: getCheckedItems', familyId);
    try {
        const response = await get('/shopping-statistics/checked-items', { familyId });
        return response;
    } catch (error) {
        console.error('Error getting checked items:', error);
        throw error;
    }
};

// Get top ingredients by quantity
export const getTopIngredients = async (familyId, limit = 5) => {
    console.log('API call: getTopIngredients', familyId, limit);
    try {
        const response = await get('/shopping-statistics/top-ingredients', { familyId, limit });
        return response;
    } catch (error) {
        console.error('Error getting top ingredients:', error);
        throw error;
    }
};

// Get top ingredients by cost
export const getTopIngredientsByCost = async (familyId, limit = 5) => {
    console.log('API call: getTopIngredientsByCost', familyId, limit);
    try {
        const response = await get('/shopping-statistics/top-ingredients-cost', { familyId, limit });
        return response;
    } catch (error) {
        console.error('Error getting top ingredients by cost:', error);
        throw error;
    }
};

// Get user statistics
export const getUserStatistics = async (userId) => {
    console.log('API call: getUserStatistics', userId);
    try {
        const response = await get(`/shopping-statistics/user/${userId}`);
        return response;
    } catch (error) {
        console.error('Error getting user statistics:', error);
        throw error;
    }
};

// Get family statistics
export const getFamilyStatistics = async (familyId) => {
    console.log('API call: getFamilyStatistics', familyId);
    try {
        const response = await get(`/shopping-statistics/family/${familyId}`);
        return response;
    } catch (error) {
        console.error('Error getting family statistics:', error);
        throw error;
    }
};
