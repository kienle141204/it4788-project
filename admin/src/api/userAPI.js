// User API Service - Using centralized auth fetch utility

import { get, post, put, del, patch } from './authFetch';

// Get users with optional pagination and filtering
export const fetchUsers = async (params = {}) => {
  console.log('API call: fetchUsers', params);

  try {
    // Real API call:
    const response = await get(`/users`, params);
    // Return the response as is to handle both paginated and non-paginated responses
    return response;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Create a new user
export const createUser = async (userData) => {
  console.log('API call: createUser', userData);
  
  try {
    // Real API call:
    return await post('/users', userData);
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Update an existing user
export const updateUser = async (id, userData) => {
  console.log('API call: updateUser', id, userData);

  try {
    // Real API call:
    return await patch(`/users/${id}`, userData);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Delete a user
export const deleteUser = async (id) => {
  console.log('API call: deleteUser', id);
  
  try {
    // Real API call:
    return await del(`/users/${id}`);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Search users
export const searchUsers = async (searchTerm, page = 1, limit = 10) => {
  console.log('API call: searchUsers', searchTerm);

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
    console.error('Error searching users:', error);
    throw error;
  }
};

// Get a single user by ID
export const getUserById = async (id) => {
  console.log('API call: getUserById', id);

  try {
    // Real API call:
    const response = await get(`/users/${id}`);
    // Return the user data from the response
    return response.data || response;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
};