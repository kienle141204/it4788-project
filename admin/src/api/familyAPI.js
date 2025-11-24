// Family API Service - Using centralized auth fetch utility

import { get, post, put, del } from './authFetch';

// Get families with optional pagination and filtering
export const fetchFamilies = async (params = {}) => {
  console.log('API call: fetchFamilies', params);

  try {
    // Use families endpoint with pagination and filtering
    const response = await get(`/families`, params);
    // Return the full response to access both data and pagination info
    return response;
  } catch (error) {
    console.error('Error fetching families:', error);
    throw error;
  }
};

// Get family by ID
export const getFamilyById = async (id) => {
  console.log('API call: getFamilyById', id);

  try {
    const response = await get(`/families/${id}`);
    // Return the family data from the response
    return response.data || response;
  } catch (error) {
    console.error('Error getting family by ID:', error);
    throw error;
  }
};

// Create a new family
export const createFamily = async (familyData) => {
  console.log('API call: createFamily', familyData);

  try {
    return await post('/families', familyData);
  } catch (error) {
    console.error('Error creating family:', error);
    throw error;
  }
};

// Update family details
export const updateFamily = async (id, familyData) => {
  console.log('API call: updateFamily', id, familyData);

  try {
    return await put(`/families/${id}`, familyData);
  } catch (error) {
    console.error('Error updating family:', error);
    throw error;
  }
};

// Delete family
export const deleteFamily = async (id) => {
  console.log('API call: deleteFamily', id);

  try {
    return await del(`/families/${id}`);
  } catch (error) {
    console.error('Error deleting family:', error);
    throw error;
  }
};

// Search families
export const searchFamilies = async (searchTerm, page = 1, limit = 10) => {
  console.log('API call: searchFamilies', searchTerm);

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
    console.error('Error searching families:', error);
    throw error;
  }
};

// Get family members - check if endpoint exists in backend
export const getFamilyMembers = async (familyId, params = {}) => {
  console.log('API call: getFamilyMembers', familyId, params);

  try {
    // Note: This endpoint may not exist in backend
    throw new Error('getFamilyMembers endpoint may not be implemented in backend');
  } catch (error) {
    console.error('Error getting family members:', error);
    throw error;
  }
};

// Add member to family - check if endpoint exists in backend
export const addFamilyMember = async (familyId, memberId) => {
  console.log('API call: addFamilyMember', familyId, memberId);

  try {
    // Note: This endpoint may not exist in backend
    throw new Error('addFamilyMember endpoint may not be implemented in backend');
  } catch (error) {
    console.error('Error adding family member:', error);
    throw error;
  }
};

// Remove member from family - check if endpoint exists in backend
export const removeFamilyMember = async (familyId, memberId) => {
  console.log('API call: removeFamilyMember', familyId, memberId);

  try {
    // Note: This endpoint may not exist in backend
    throw new Error('removeFamilyMember endpoint may not be implemented in backend');
  } catch (error) {
    console.error('Error removing family member:', error);
    throw error;
  }
};

// Get family menus - check if endpoint exists in backend
export const getFamilyMenus = async (familyId, params = {}) => {
  console.log('API call: getFamilyMenus', familyId, params);

  try {
    // Note: This endpoint may not exist in backend
    throw new Error('getFamilyMenus endpoint may not be implemented in backend');
  } catch (error) {
    console.error('Error getting family menus:', error);
    throw error;
  }
};

// Get family statistics - check if endpoint exists in backend
export const getFamilyStats = async () => {
  console.log('API call: getFamilyStats');

  try {
    // Note: This endpoint may not exist in backend
    throw new Error('getFamilyStats endpoint may not be implemented in backend');
  } catch (error) {
    console.error('Error getting family stats:', error);
    throw error;
  }
};