// Upload API Service - Using centralized auth fetch utility with token refresh support

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090/api';

// Upload file to server with token refresh support
export const uploadFile = async (file, folder = 'ingredients') => {
  console.log('API call: uploadFile', file, folder);

  const makeUploadRequest = async (token) => {
    // Create FormData
    const formData = new FormData();
    formData.append('file', file);
    if (folder) {
      formData.append('folder', folder);
    }

    // Make request with FormData (don't set Content-Type header, browser will set it with boundary)
    const response = await fetch(`${API_BASE_URL}/upload/file`, {
      method: 'POST',
      headers: {
        // Don't set Content-Type, browser will set it automatically with boundary for FormData
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    return response;
  };

  try {
    let accessToken = localStorage.getItem('access_token');
    let response = await makeUploadRequest(accessToken);

    // If unauthorized, try to refresh token
    if (response.status === 401) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            // Update token in localStorage
            localStorage.setItem('access_token', refreshData.access_token);

            // Retry upload with new token
            accessToken = refreshData.access_token;
            response = await makeUploadRequest(accessToken);
          } else {
            // Refresh failed, redirect to login
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            throw new Error('Authentication required');
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          throw refreshError;
        }
      } else {
        // No refresh token, redirect to login
        window.location.href = '/login';
        throw new Error('Authentication required');
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = `Upload failed: ${response.status}`;
      if (typeof errorData.message === 'string') {
        errorMessage = errorData.message;
      } else if (errorData.resultMessage?.vn) {
        errorMessage = errorData.resultMessage.vn;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    // Return the URL from the response
    return result.data?.url || result.data?.secure_url || result.url || result;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

