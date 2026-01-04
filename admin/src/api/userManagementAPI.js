// User Management API Service - Using centralized auth fetch utility
// Includes admin-specific user management endpoints

import { get, post, put, del } from './authFetch';

// Get users with optional pagination and filtering (admin endpoint)
export const fetchUserManagement = async (params = {}) => {

  try {
    // Use users endpoint with pagination and filtering
    const response = await get(`/users`, params);
    // Return the full response to access both data and pagination info
    return response;
  } catch (error) {
    throw error;
  }
};

// Get users management (admin) - using same function to avoid duplication
export const fetchUsersManagement = async (params = {}) => {

  try {
    // Use users endpoint with pagination and filtering
    const response = await get(`/users`, params);
    // Return the full response to access both data and pagination info
    return response;
  } catch (error) {
    throw error;
  }
};

// Get user by ID (admin)
export const getUserManagementById = async (id) => {

  try {
    const response = await get(`/users/${id}`);
    // Return the user data from the response
    return response.data || response;
  } catch (error) {
    throw error;
  }
};

// Search users management
export const searchUsersManagement = async (searchTerm, page = 1, limit = 10) => {

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
    throw error;
  }
};

// Admin-specific functions that may not exist - marked as not implemented
export const createUserManagement = async (userData) => {

  try {
    // Note: This endpoint may not exist in backend
    throw new Error('createUserManagement endpoint may not be implemented in backend');
  } catch (error) {
    throw error;
  }
};

export const updateUserManagement = async (id, userData) => {

  try {
    // Note: This endpoint may not exist in backend
    throw new Error('updateUserManagement endpoint may not be implemented in backend');
  } catch (error) {
    throw error;
  }
};

export const deleteUserManagement = async (id) => {

  try {
    // Note: This endpoint may not exist in backend
    throw new Error('deleteUserManagement endpoint may not be implemented in backend');
  } catch (error) {
    throw error;
  }
};

// Admin-specific functions that definitely don't exist
export const updateUserRole = async (userId, role) => {

  try {
    // Note: This endpoint may not exist in backend
    throw new Error('updateUserRole endpoint may not be implemented in backend');
  } catch (error) {
    throw error;
  }
};

export const getUserStats = async () => {

  try {
    // Note: This endpoint may not exist in backend
    throw new Error('getUserStats endpoint may not be implemented in backend');
  } catch (error) {
    throw error;
  }
};

export const getUserFamilies = async (userId, params = {}) => {

  try {
    // Note: This endpoint may not exist in backend
    throw new Error('getUserFamilies endpoint may not be implemented in backend');
  } catch (error) {
    throw error;
  }
};

export const getUserRecipes = async (userId, params = {}) => {

  try {
    // Note: This endpoint may not exist in backend
    throw new Error('getUserRecipes endpoint may not be implemented in backend');
  } catch (error) {
    throw error;
  }
};

export const getUserReviews = async (userId, params = {}) => {

  try {
    // Note: This endpoint may not exist in backend
    throw new Error('getUserReviews endpoint may not be implemented in backend');
  } catch (error) {
    throw error;
  }
};
