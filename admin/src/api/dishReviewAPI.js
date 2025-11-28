// Dish Review API Service - Using centralized auth fetch utility

import { get, post, put, del } from './authFetch';

// Get dish reviews with optional pagination and filtering
export const fetchDishReviews = async (dishId, params = {}) => {
  console.log('API call: fetchDishReviews', dishId, params);

  try {
    // Use the dish reviews endpoint with pagination support
    const response = await get(`/dishes/${dishId}/reviews`, params);
    // Return the full response to access both data and pagination info
    return response;
  } catch (error) {
    console.error('Error fetching dish reviews:', error);
    throw error;
  }
};

// Create a new dish review
export const createDishReview = async (dishId, reviewData) => {
  console.log('API call: createDishReview', dishId, reviewData);

  try {
    return await post(`/dishes/${dishId}/reviews`, reviewData);
  } catch (error) {
    console.error('Error creating dish review:', error);
    throw error;
  }
};

// Update an existing dish review
export const updateDishReview = async (dishId, reviewId, reviewData) => {
  console.log('API call: updateDishReview', dishId, reviewId, reviewData);

  try {
    return await put(`/dishes/${dishId}/reviews/${reviewId}`, reviewData);
  } catch (error) {
    console.error('Error updating dish review:', error);
    throw error;
  }
};

// Delete a dish review
export const deleteDishReview = async (dishId, reviewId) => {
  console.log('API call: deleteDishReview', dishId, reviewId);

  try {
    return await del(`/dishes/${dishId}/reviews/${reviewId}`);
  } catch (error) {
    console.error('Error deleting dish review:', error);
    throw error;
  }
};

// Search dish reviews
export const searchDishReviews = async (dishId, searchTerm, page = 1, limit = 10) => {
  console.log('API call: searchDishReviews', dishId, searchTerm);

  try {
    // For dish review search, we may need to filter by rating or comment
    const response = await get(`/dishes/${dishId}/reviews`, {
      q: searchTerm,
      page: page,
      limit: limit
    });
    // Return the full response to access both data and pagination info
    return response;
  } catch (error) {
    console.error('Error searching dish reviews:', error);
    throw error;
  }
};

// Get a single dish review by ID
export const getDishReviewById = async (dishId, reviewId) => {
  console.log('API call: getDishReviewById', dishId, reviewId);

  try {
    const response = await get(`/dishes/${dishId}/reviews/${reviewId}`);
    // Return the review data from the response
    return response.data || response;
  } catch (error) {
    console.error('Error getting dish review by ID:', error);
    throw error;
  }
};

// Get dish review statistics
export const getDishReviewStats = async (dishId) => {
  console.log('API call: getDishReviewStats', dishId);

  try {
    // Get review statistics for a specific dish
    return await get(`/dishes/${dishId}/reviews/stats`);
  } catch (error) {
    console.error('Error getting dish review stats:', error);
    throw error;
  }
};