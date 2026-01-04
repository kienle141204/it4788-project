// Centralized API configuration
// API URL is read from environment variable (.env file)
// To change API URL, modify VITE_API_BASE_URL in .env file

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090/api';

