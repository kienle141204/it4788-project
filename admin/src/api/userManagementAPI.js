// User Management API Service - Using centralized auth fetch utility
// Includes admin-specific user management endpoints

import { get, post, put, del } from './authFetch';

// Get users with optional pagination and filtering (admin endpoint)
export const fetchUserManagement = async (params = {}) => {
  console.log('API call: fetchUsers', params);

  try {
    // Use users endpoint with pagination and filtering
    const response = await get(`/users`, params);
    // Return the full response to access both data and pagination info
    return response;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Get users management (admin) - using same function to avoid duplication
export const fetchUsersManagement = async (params = {}) => {
  console.log('API call: fetchUsersManagement', params);

  try {
    // Use users endpoint with pagination and filtering
    const response = await get(`/users`, params);
    // Return the full response to access both data and pagination info
    return response;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Get user by ID (admin)
export const getUserManagementById = async (id) => {
  console.log('API call: getUserManagementById', id);

  try {
    const response = await get(`/users/${id}`);
    // Return the user data from the response
    return response.data || response;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
};

// Search users management
export const searchUsersManagement = async (searchTerm, page = 1, limit = 10) => {
  console.log('API call: searchUsersManagement', searchTerm);

  try {
    // Using the /users endpoint with query parameters for search
    const response = await get(`/users/search`, {
      q: searchTerm,
      page: page,
      limit: limit
    });
    // Return the full response to access both data and pagination info
    return response;
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

// Admin-specific functions that may not exist - marked as not implemented
export const createUserManagement = async (userData) => {
  console.log('API call: createUserManagement', userData);

  try {
    // Note: This endpoint may not exist in backend
    throw new Error('createUserManagement endpoint may not be implemented in backend');
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUserManagement = async (id, userData) => {
  console.log('API call: updateUserManagement', id, userData);

  try {
    // Note: This endpoint may not exist in backend
    throw new Error('updateUserManagement endpoint may not be implemented in backend');
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUserManagement = async (id) => {
  console.log('API call: deleteUserManagement', id);

  try {
    // Note: This endpoint may not exist in backend
    throw new Error('deleteUserManagement endpoint may not be implemented in backend');
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Admin-specific functions that definitely don't exist
export const updateUserRole = async (userId, role) => {
  console.log('API call: updateUserRole', userId, role);

  try {
    // Note: This endpoint may not exist in backend
    throw new Error('updateUserRole endpoint may not be implemented in backend');
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

export const getUserStats = async () => {
  console.log('API call: getUserStats');

  try {
    // Note: This endpoint may not exist in backend
    throw new Error('getUserStats endpoint may not be implemented in backend');
  } catch (error) {
    console.error('Error getting user stats:', error);
    throw error;
  }
};

export const getUserFamilies = async (userId, params = {}) => {
  console.log('API call: getUserFamilies', userId, params);

  try {
    // Note: This endpoint may not exist in backend
    throw new Error('getUserFamilies endpoint may not be implemented in backend');
  } catch (error) {
    console.error('Error getting user families:', error);
    throw error;
  }
};

export const getUserRecipes = async (userId, params = {}) => {
  console.log('API call: getUserRecipes', userId, params);

  try {
    // Note: This endpoint may not exist in backend
    throw new Error('getUserRecipes endpoint may not be implemented in backend');
  } catch (error) {
    console.error('Error getting user recipes:', error);
    throw error;
  }
};

export const getUserReviews = async (userId, params = {}) => {
  console.log('API call: getUserReviews', userId, params);

  try {
    // Note: This endpoint may not exist in backend
    throw new Error('getUserReviews endpoint may not be implemented in backend');
  } catch (error) {
    console.error('Error getting user reviews:', error);
    throw error;
  }
};