import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Tự động phát hiện môi trường để chọn API domain phù hợp
// Web: localhost, Android emulator: 10.0.2.2, iOS simulator: localhost
const getApiDomain = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:8090/api/';
  } else if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8090/api/';
  } else {
    // iOS simulator hoặc các platform khác
    return 'http://localhost:8090/api/';
  }
};

// Export API_DOMAIN để các module khác có thể detect environment
export const API_DOMAIN = getApiDomain();
// Uncomment dòng dưới khi deploy lên production (Render)
// export const API_DOMAIN = process.env.API || 'https://it4788-project-ttac.onrender.com/api/';
const REFRESH_THRESHOLD_SECONDS = 5 * 60;
const config = {
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
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
          body: formData,
        }),
        timeoutPromise,
      ]);

      // Check if response is valid (not from timeout)
      if (!(response instanceof Response)) {
        throw new Error('Upload timeout');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
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
};

const getTokenHeader = async () => {
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

const ensureTokenValid = async (): Promise<boolean> => {
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
      throw error;
    } else {
      throw error;
    }
  }
};

export const postAccess = async (path: string, data: object, retryCount = 0): Promise<any> => {
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
      if (error.response?.status === 401 && retryCount === 0) {
        await refreshAccessToken();
        return postAccess(path, data, retryCount + 1);
      }
      if (error.response?.status === 401) {
      }
      throw error;
    } else {
      throw error;
    }
  }
};

export const patchAccess = async (path: string, data: object, retryCount = 0): Promise<any> => {
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
      if (error.response?.status === 401 && retryCount === 0) {
        await refreshAccessToken();
        return patchAccess(path, data, retryCount + 1);
      }
      if (error.response?.status === 401) {
      }
      throw error;
    } else {
      throw error;
    }
  }
};

export const deleteAccess = async (path: string, retryCount = 0): Promise<any> => {
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
      if (error.response?.status === 401 && retryCount === 0) {
        await refreshAccessToken();
        return deleteAccess(path, retryCount + 1);
      }
      if (error.response?.status === 401) {
      }
      throw error;
    } else {
      throw error;
    }
  }
};
