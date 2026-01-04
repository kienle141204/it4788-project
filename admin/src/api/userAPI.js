// User API Service - Using centralized auth fetch utility

import { get, post, put, del, patch } from './authFetch';

// Get users with optional pagination and filtering
export const fetchUsers = async (params = {}) => {

  try {
    // Real API call:
    const response = await get(`/users`, params);
    // Return the response as is to handle both paginated and non-paginated responses
    return response;
  } catch (error) {
    throw error;
  }
};

// Create a new user
export const createUser = async (userData) => {
  
  try {
    // Real API call:
    return await post('/users', userData);
  } catch (error) {
    throw error;
  }
};

// Update an existing user
export const updateUser = async (id, userData) => {

  try {
    // Real API call:
    return await patch(`/users/${id}`, userData);
  } catch (error) {
    throw error;
  }
};

// Delete a user
export const deleteUser = async (id) => {
  
  try {
    // Real API call:
    return await del(`/users/${id}`);
  } catch (error) {
    throw error;
  }
};

// Search users
export const searchUsers = async (searchTerm, page = 1, limit = 10) => {

  try {
    // Real API call:
    const response = await get(`/users/search`, {
      q: searchTerm,
      page: page,
      limit: limit
    });
    // Return the response as is to handle both paginated and non-paginated responses
    return response;
  } catch (error) {
    throw error;
  }
};

// Get a single user by ID
export const getUserById = async (id) => {

  try {
    // Real API call:
    const response = await get(`/users/${id}`);
    // Return the user data from the response
    return response.data || response;
  } catch (error) {
    throw error;
  }
};
