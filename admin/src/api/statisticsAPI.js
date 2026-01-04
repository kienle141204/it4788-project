// Shopping Statistics API Service
import { get } from './authFetch';

// Get total cost by month
export const getMonthlyCost = async (year, familyId) => {
    try {
        const response = await get('/shopping-statistics/monthly-cost', { year, familyId });
        return response;
    } catch (error) {
        throw error;
    }
};

// Get checked items count
export const getCheckedItems = async (familyId) => {
    try {
        const response = await get('/shopping-statistics/checked-items', { familyId });
        return response;
    } catch (error) {
        throw error;
    }
};

// Get top ingredients by quantity
export const getTopIngredients = async (familyId, limit = 5) => {
    try {
        const response = await get('/shopping-statistics/top-ingredients', { familyId, limit });
        return response;
    } catch (error) {
        throw error;
    }
};

// Get top ingredients by cost
export const getTopIngredientsByCost = async (familyId, limit = 5) => {
    try {
        const response = await get('/shopping-statistics/top-ingredients-cost', { familyId, limit });
        return response;
    } catch (error) {
        throw error;
    }
};

// Get user statistics
export const getUserStatistics = async (userId) => {
    try {
        const response = await get(`/shopping-statistics/user/${userId}`);
        return response;
    } catch (error) {
        throw error;
    }
};

// Get family statistics
export const getFamilyStatistics = async (familyId) => {
    try {
        const response = await get(`/shopping-statistics/family/${familyId}`);
        return response;
    } catch (error) {
        throw error;
    }
};
