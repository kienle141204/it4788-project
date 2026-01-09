import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { isNetworkAvailable } from './network';
import { addToQueue } from './requestQueue';
// import { getCache , generateCacheKey } from './cache';

// Tự động phát hiện môi trường để chọn API domain phù hợp
// Web: localhost, Android emulator: 10.0.2.2, iOS simulator: localhost
// const getApiDomain = () => {
//   if (Platform.OS === 'web') {
//     return 'http://localhost:8090/api/';
//   } else if (Platform.OS === 'android') {
//     return 'http://10.0.2.2:8090/api/';
//   } else {
//     // iOS simulator hoặc các platform khác
//     return 'http://localhost:8090/api/';
//   }
// };

// const API_DOMAIN = getApiDomain();
export const API_DOMAIN = 'https://it4788-project-ttac.onrender.com/api/';
const REFRESH_THRESHOLD_SECONDS = 5 * 60;
const config = {
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds timeout for all requests
}

export const get = async (path: string) => {
  try {
    const result = await axios.get(API_DOMAIN + path, { withCredentials: true });
    return result;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      return error.response?.data || {
        statusCode: error.response?.status || 500,
        message: error.message || 'Network Error'
      };
    } else {
      return {
        statusCode: 500,
        message: error?.message || 'Network connect failed'
      };
    }
  }
}

export const post = async (path: string, data: object) => {
  try {
    const res = await axios.post(API_DOMAIN + path, data, config);
    return res.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      // Return error response data or structured error object
      return error.response?.data || {
        statusCode: error.response?.status || 500,
        message: error.message || 'Network Error'
      };
    } else {
      // Return structured error instead of throwing
      return {
        statusCode: 500,
        message: error?.message || 'Unknown error occurred'
      };
    }
  }
};

export const patch = async (path: string, data: object) => {
  try {
    const res = await axios.patch(API_DOMAIN + path, data, config)
    return res
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      return error.response?.data || {
        statusCode: error.response?.status || 500,
        message: error.message || 'Network Error'
      };
    } else {
      return {
        statusCode: 500,
        message: error?.message || 'Unknown error occurred'
      };
    }
  }
}

export const deleteData = async (path: String) => {
  try {
    const res = await axios.delete(API_DOMAIN + path)
    return res
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      return error.response?.data || {
        statusCode: error.response?.status || 500,
        message: error.message || 'Network Error'
      };
    } else {
      return {
        statusCode: 500,
        message: error?.message || 'Unknown error occurred'
      };
    }
  }
}

export const upImage = async (path: string, data: object) => {
  try {
    const response = await axios.post(API_DOMAIN + path, data, { headers: { 'Content-Type': 'multipart/form-data' } })
    return response
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      return error.response?.data || {
        statusCode: error.response?.status || 500,
        message: error.message || 'Network Error'
      };
    } else {
      return {
        statusCode: 500,
        message: error?.message || 'Unknown error occurred'
      };
    }
  }
}

export const uploadFileAccess = async (formData: FormData, folder?: string, retryCount = 0): Promise<any> => {
  let tokenHeader: { Authorization?: string } = {};
  try {
    await ensureTokenValid();
    tokenHeader = await getTokenHeader();

    // Only append folder if not already in formData
    if (folder) {
      formData.append('folder', folder);
    }

    const uploadUrl = API_DOMAIN + 'upload/file';

    // Use React Native's fetch API instead of axios for FormData uploads
    // React Native's fetch handles FormData better than axios
    const headers: any = {
      Accept: 'application/json',
    };

    // Add authorization header if exists
    if (tokenHeader.Authorization) {
      headers.Authorization = tokenHeader.Authorization;
    }

    // Don't set Content-Type - fetch will set it automatically with boundary for FormData

    try {
      console.log('[Upload] Sending request to:', uploadUrl);
      console.log('[Upload] Headers:', { ...headers, Authorization: headers.Authorization ? 'Bearer ***' : undefined });
      
      // Use fetch API with timeout
      // Create a promise that rejects after timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Upload timeout')), 60000); // 60 seconds
      });

      // Race between fetch and timeout
      const response = await Promise.race([
        fetch(uploadUrl, {
          method: 'POST',
          headers: headers,
          body: formData as any,
        }),
        timeoutPromise,
      ]);
      
      console.log('[Upload] Response status:', response.status, response.statusText);

      // Check if response is valid (not from timeout)
      if (!(response instanceof Response)) {
        throw new Error('Upload timeout');
      }

      if (!response.ok) {
        const errorData: any = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`,
        }));

        // Handle 401 Unauthorized
        if (response.status === 401 && retryCount === 0) {
          await refreshAccessToken();
          return uploadFileAccess(formData, folder, retryCount + 1);
        }

        throw {
          response: {
            status: response.status,
            statusText: response.statusText,
            data: errorData,
          },
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return data;
    } catch (fetchError: any) {
      // Handle timeout
      if (fetchError.message?.includes('Upload timeout') || fetchError.message?.includes('timeout')) {
        throw {
          code: 'ECONNABORTED',
          message: 'Upload timeout. Please check your connection and try again.',
        };
      }

      // Handle network errors
      if (fetchError.message?.includes('Network request failed') ||
        fetchError.message?.includes('Failed to fetch') ||
        fetchError.message?.includes('NetworkError') ||
        fetchError.message?.includes('Network Error')) {
        throw {
          code: 'ERR_NETWORK',
          message: 'Network request failed. Please check:\n- Internet connection\n- Backend server is running\n- API address is correct',
        };
      }

      // Re-throw if it's already formatted
      if (fetchError.response) {
        throw fetchError;
      }

      // Wrap other errors
      throw {
        code: 'UNKNOWN_ERROR',
        message: fetchError.message || 'Unknown error occurred',
        originalError: fetchError,
      };
    }
  } catch (error: any) {
    if (error instanceof Error && error.message === 'SESSION_EXPIRED') {
      throw error;
    }

    // Handle 401 errors
    if (error.response?.status === 401) {
    }

    throw error;
  }
};


// Helper to decode JWT without verification (just to check expiration)
export const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const logoutUser = async () => {
  await AsyncStorage.removeItem('access_token');
  await AsyncStorage.removeItem('refresh_token');
  
  // Clear all cache on logout
  try {
    const cacheModule = await import('./cache') as { clearCache?: () => Promise<void> };
    if (cacheModule.clearCache) {
      await cacheModule.clearCache();
    }
  } catch (error) {
    // Silently fail if cache module not available
  }
};

export const getTokenHeader = async () => {
  const token = await AsyncStorage.getItem('access_token');
  if (!token) {
    return {};
  }

  // Verify token format (should not already have Bearer prefix)
  const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
  const authHeader = { Authorization: `Bearer ${cleanToken}` };

  // Decode token to check expiration
  const decoded = decodeJWT(cleanToken);
  if (decoded) {
    const exp = decoded.exp;
    const now = Math.floor(Date.now() / 1000);
    const isExpired = exp && exp < now;
    const timeUntilExpiry = exp ? exp - now : null;

    if (isExpired) {
    }
  }

  return authHeader;
};

// Helper to refresh token and update AsyncStorage
const refreshAccessToken = async (): Promise<boolean> => {
  const refresh_token = await AsyncStorage.getItem('refresh_token');
  if (!refresh_token) {
    await logoutUser();
    throw new Error('SESSION_EXPIRED');
  }

  try {
    const response = await axios.post(API_DOMAIN + 'auth/refresh-token', {
      refresh_token: refresh_token.startsWith('Bearer ') ? refresh_token.substring(7) : refresh_token
    }, config);

    if (response.data && response.data.access_token && response.data.refresh_token) {
      await AsyncStorage.setItem('access_token', response.data.access_token);
      await AsyncStorage.setItem('refresh_token', response.data.refresh_token);
      return true;
    }

    await logoutUser();
    throw new Error('SESSION_EXPIRED');
  } catch (error: any) {
    await logoutUser();
    throw new Error('SESSION_EXPIRED');
  }
};

export const ensureTokenValid = async (): Promise<boolean> => {
  const token = await AsyncStorage.getItem('access_token');
  if (!token) {
    await logoutUser();
    throw new Error('SESSION_EXPIRED');
  }

  const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
  const decoded = decodeJWT(cleanToken);
  if (!decoded || !decoded.exp) {
    await logoutUser();
    throw new Error('SESSION_EXPIRED');
  }

  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = decoded.exp - now;

  if (timeUntilExpiry <= 0) {
    await refreshAccessToken();
    return true;
  }

  if (timeUntilExpiry < REFRESH_THRESHOLD_SECONDS) {
    await refreshAccessToken();
  }

  return true;
};

export const getAccess = async (path: string, params: object = {}, retryCount = 0): Promise<any> => {
  const networkAvailable = isNetworkAvailable();
  
  // If offline, try to get from cache first
  if (!networkAvailable) {
    try {
      const cacheKey = 1
      const cachedData = 1
      if (cachedData !== null) {
        console.log(`[API] Offline: Returning cached data for ${path}`);
        return cachedData;
      }
    } catch (cacheError) {
      console.warn(`[API] Error reading cache for ${path}:`, cacheError);
    }
    // If no cache available, throw error with clear message
    throw new Error('OFFLINE_NO_CACHE: Không có kết nối mạng và không có dữ liệu trong cache');
  }

  let tokenHeader = {};
  try {
    await ensureTokenValid();
    tokenHeader = await getTokenHeader();
    const result = await axios.get(API_DOMAIN + path, {
      ...config,
      headers: { ...config.headers, ...tokenHeader },
      params,
    });
    return result.data;
  } catch (error: any) {
    if (error instanceof Error && error.message === 'SESSION_EXPIRED') {
      throw error;
    }
    if (axios.isAxiosError(error)) {
      // Don't log 404 errors for expected empty states - these are handled by components
      const errorMessage = error.response?.data?.message || '';
      const is404Expected = error.response?.status === 404 &&
        (errorMessage.includes('chưa có tủ lạnh') ||
          errorMessage.includes('Bạn chưa có tủ lạnh') ||
          errorMessage.includes('Không tìm thấy món ăn trong tủ lạnh') ||
          errorMessage.includes('Không tìm thấy nguyên liệu trong tủ lạnh'));

      if (error.response?.status === 401 && retryCount === 0) {
        await refreshAccessToken();
        return getAccess(path, params, retryCount + 1);
      }
      if (error.response?.status === 401) {
      }
      
      // If network error (no response), try cache as fallback
      const isNetworkError = 
        error.code === 'ERR_NETWORK' ||
        error.message?.includes('Network') ||
        error.message?.includes('network') ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('timeout') ||
        !error.response;
      
      if (isNetworkError && retryCount === 0) {
        try {
          const cacheKey = 1
          const cachedData = 1
          if (cachedData !== null) {
            console.log(`[API] Network error: Returning cached data for ${path}`);
            return cachedData;
          }
        } catch (cacheError) {
          console.warn(`[API] Error reading cache for ${path}:`, cacheError);
        }
      }
      
      throw error;
    } else {
      throw error;
    }
  }
};

export const postAccess = async (path: string, data: object, retryCount = 0): Promise<any> => {
  // Check network availability before making request
  const networkAvailable = isNetworkAvailable();
  
  let tokenHeader = {};
  try {
    await ensureTokenValid();
    tokenHeader = await getTokenHeader();
    const res = await axios.post(API_DOMAIN + path, data, { ...config, headers: { ...config.headers, ...tokenHeader } });
    return res.data;
  } catch (error: any) {
    if (error instanceof Error && error.message === 'SESSION_EXPIRED') {
      throw error;
    }
    if (axios.isAxiosError(error)) {
      // Handle 401 Unauthorized
      if (error.response?.status === 401 && retryCount === 0) {
        await refreshAccessToken();
        return postAccess(path, data, retryCount + 1);
      }
      if (error.response?.status === 401) {
        throw error;
      }
      
      // Handle network errors - queue request if offline
      const isNetworkError = 
        !networkAvailable ||
        error.code === 'ERR_NETWORK' ||
        error.message?.includes('Network') ||
        error.message?.includes('network') ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('timeout') ||
        !error.response; // No response usually means network issue
      
      if (isNetworkError && retryCount === 0) {
        // Queue the request for later
        try {
          const requestId = await addToQueue('POST', path, data, tokenHeader as Record<string, string>);
          console.log(`[API] Network error, queued POST ${path} (ID: ${requestId})`);
          
          // Return optimistic response to prevent UI errors
          // The actual data will be synced when network is back
          return {
            success: true,
            message: 'Request queued for offline sync',
            queued: true,
            requestId,
            data: data, // Return the data that was sent
          };
        } catch (queueError) {
          console.error('[API] Error queueing request:', queueError);
          // If queueing fails, throw original error
          throw error;
        }
      }
      
      throw error;
    } else {
      throw error;
    }
  }
};

export const patchAccess = async (path: string, data: object, retryCount = 0): Promise<any> => {
  // Check network availability before making request
  const networkAvailable = isNetworkAvailable();
  
  let tokenHeader = {};
  try {
    await ensureTokenValid();
    tokenHeader = await getTokenHeader();
    const res = await axios.patch(API_DOMAIN + path, data, { ...config, headers: { ...config.headers, ...tokenHeader } });
    return res.data;
  } catch (error: any) {
    if (error instanceof Error && error.message === 'SESSION_EXPIRED') {
      throw error;
    }
    if (axios.isAxiosError(error)) {
      // Handle 401 Unauthorized
      if (error.response?.status === 401 && retryCount === 0) {
        await refreshAccessToken();
        return patchAccess(path, data, retryCount + 1);
      }
      if (error.response?.status === 401) {
        throw error;
      }
      
      // Handle network errors - queue request if offline
      const isNetworkError = 
        !networkAvailable ||
        error.code === 'ERR_NETWORK' ||
        error.message?.includes('Network') ||
        error.message?.includes('network') ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('timeout') ||
        !error.response; // No response usually means network issue
      
      if (isNetworkError && retryCount === 0) {
        // Queue the request for later
        try {
          const requestId = await addToQueue('PATCH', path, data, tokenHeader as Record<string, string>);
          console.log(`[API] Network error, queued PATCH ${path} (ID: ${requestId})`);
          
          // Return optimistic response to prevent UI errors
          return {
            success: true,
            message: 'Request queued for offline sync',
            queued: true,
            requestId,
            data: data, // Return the data that was sent
          };
        } catch (queueError) {
          console.error('[API] Error queueing request:', queueError);
          throw error;
        }
      }
      
      throw error;
    } else {
      throw error;
    }
  }
};

export const deleteAccess = async (path: string, retryCount = 0): Promise<any> => {
  // Check network availability before making request
  const networkAvailable = isNetworkAvailable();
  
  let tokenHeader = {};
  try {
    await ensureTokenValid();
    tokenHeader = await getTokenHeader();
    const res = await axios.delete(API_DOMAIN + path, { ...config, headers: { ...config.headers, ...tokenHeader } });
    return res.data;
  } catch (error: any) {
    if (error instanceof Error && error.message === 'SESSION_EXPIRED') {
      throw error;
    }
    if (axios.isAxiosError(error)) {
      // Handle 401 Unauthorized
      if (error.response?.status === 401 && retryCount === 0) {
        await refreshAccessToken();
        return deleteAccess(path, retryCount + 1);
      }
      if (error.response?.status === 401) {
        throw error;
      }
      
      // Handle network errors - queue request if offline
      const isNetworkError = 
        !networkAvailable ||
        error.code === 'ERR_NETWORK' ||
        error.message?.includes('Network') ||
        error.message?.includes('network') ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('timeout') ||
        !error.response; // No response usually means network issue
      
      if (isNetworkError && retryCount === 0) {
        // Queue the request for later
        try {
          const requestId = await addToQueue('DELETE', path, undefined, tokenHeader as Record<string, string>);
          console.log(`[API] Network error, queued DELETE ${path} (ID: ${requestId})`);
          
          // Return optimistic response to prevent UI errors
          return {
            success: true,
            message: 'Request queued for offline sync',
            queued: true,
            requestId,
          };
        } catch (queueError) {
          console.error('[API] Error queueing request:', queueError);
          throw error;
        }
      }
      
      throw error;
    } else {
      throw error;
    }
  }
};
