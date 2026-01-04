// Dish Review API Service - Using centralized auth fetch utility

import { get, post, put, del } from './authFetch';

// Get dish reviews with optional pagination and filtering
export const fetchDishReviews = async (dishId, params = {}) => {

  try {
    // Use the dish reviews endpoint with pagination support
    const response = await get(`/dishes/${dishId}/reviews`, params);
    // Return the full response to access both data and pagination info
    return response;
  } catch (error) {
    throw error;
  }
};

// Create a new dish review
export const createDishReview = async (dishId, reviewData) => {

  try {
    return await post(`/dishes/${dishId}/reviews`, reviewData);
  } catch (error) {
    throw error;
  }
};

// Update an existing dish review
export const updateDishReview = async (dishId, reviewId, reviewData) => {

  try {
    return await put(`/dishes/${dishId}/reviews/${reviewId}`, reviewData);
  } catch (error) {
    throw error;
  }
};

// Delete a dish review
export const deleteDishReview = async (dishId, reviewId) => {

  try {
    return await del(`/dishes/${dishId}/reviews/${reviewId}`);
  } catch (error) {
    throw error;
  }
};

// Search dish reviews
export const searchDishReviews = async (dishId, searchTerm, page = 1, limit = 10) => {

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
    throw error;
  }
};

// Get a single dish review by ID
export const getDishReviewById = async (dishId, reviewId) => {

  try {
    const response = await get(`/dishes/${dishId}/reviews/${reviewId}`);
    // Return the review data from the response
    return response.data || response;
  } catch (error) {
    throw error;
  }
};

// Get dish review statistics
export const getDishReviewStats = async (dishId) => {

  try {
    // Get review statistics for a specific dish
    return await get(`/dishes/${dishId}/reviews/stats`);
  } catch (error) {
    throw error;
  }
};
