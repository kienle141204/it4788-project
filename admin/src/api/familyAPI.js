// Family API Service - Using centralized auth fetch utility

import { get, post, put, del } from './authFetch';

// Get families with optional pagination and filtering
export const fetchFamilies = async (params = {}) => {

  try {
    // Use families endpoint with pagination and filtering
    const response = await get(`/families`, params);
    // Return the full response to access both data and pagination info
    return response;
  } catch (error) {
    throw error;
  }
};

// Get family by ID
export const getFamilyById = async (id) => {

  try {
    const response = await get(`/families/${id}`);
    // Return the family data from the response
    return response.data || response;
  } catch (error) {
    throw error;
  }
};

// Create a new family
export const createFamily = async (familyData) => {

  try {
    return await post('/families', familyData);
  } catch (error) {
    throw error;
  }
};

// Update family details
export const updateFamily = async (id, familyData) => {

  try {
    return await put(`/families/${id}`, familyData);
  } catch (error) {
    throw error;
  }
};

// Delete family
export const deleteFamily = async (id) => {

  try {
    return await del(`/families/${id}`);
  } catch (error) {
    throw error;
  }
};

// Search families
export const searchFamilies = async (searchTerm, page = 1, limit = 10) => {

  try {
    // Search with pagination
    const response = await get(`/families`, {
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

// Get family members - using correct endpoint
export const getFamilyMembers = async (familyId) => {

  try {
    const response = await get(`/families/${familyId}/members`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Add member to family using correct endpoint
export const addFamilyMember = async (familyId, memberId, role = 'member') => {

  try {
    return await post('/families/add-member', {
      family_id: familyId,
      member_id: memberId,
      role: role
    });
  } catch (error) {
    throw error;
  }
};


// Remove member from family - check if endpoint exists in backend
export const removeFamilyMember = async (familyId, memberId) => {

  try {
    // Note: This endpoint may not exist in backend
    throw new Error('removeFamilyMember endpoint may not be implemented in backend');
  } catch (error) {
    throw error;
  }
};

// Get family menus - check if endpoint exists in backend
export const getFamilyMenus = async (familyId, params = {}) => {

  try {
    // Note: This endpoint may not exist in backend
    throw new Error('getFamilyMenus endpoint may not be implemented in backend');
  } catch (error) {
    throw error;
  }
};

// Get family statistics - check if endpoint exists in backend
export const getFamilyStats = async () => {

  try {
    // Note: This endpoint may not exist in backend
    throw new Error('getFamilyStats endpoint may not be implemented in backend');
  } catch (error) {
    throw error;
  }
};
