import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

declare module 'axios' {
  export interface AxiosRequestConfig {
    _retry?: boolean;
  }
}

const API_DOMAIN = process.env.API || 'http://localhost:8090/api/';

const apiClient = axios.create({
  baseURL: API_DOMAIN,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use(async config => {
  try {
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.error('Cannot read access token from storage:', err);
  }
  return config;
});
let isRefreshing = false;
let pendingRequests: Array<(token: string | null) => void> = [];

const enqueueRequest = (callback: (token: string | null) => void) => {
  pendingRequests.push(callback);
};

const resolvePendingRequests = (token: string | null) => {
  pendingRequests.forEach(callback => callback(token));
  pendingRequests = [];
};

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = await AsyncStorage.getItem('refresh_token');
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await axios.post(`${API_DOMAIN}auth/refresh-token`, {
      refresh_token: refreshToken,
    });
    const { access_token, refresh_token } = response.data || {};

    if (access_token && refresh_token) {
      await AsyncStorage.setItem('access_token', access_token);
      await AsyncStorage.setItem('refresh_token', refresh_token);
      return access_token;
    }
  } catch (error) {
    console.error('Refresh token failed:', error);
  }

  await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
  return null;
};

apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest?._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          enqueueRequest(token => {
            if (!token || !originalRequest) {
              return reject(error);
            }
            originalRequest.headers = originalRequest.headers ?? {};
            (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const newToken = await refreshAccessToken();
      resolvePendingRequests(newToken);
      isRefreshing = false;

      if (newToken && originalRequest) {
        originalRequest.headers = originalRequest.headers ?? {};
        (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

const handleRequestError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return error.response;
  }
  throw error;
};

export const get = async (path: string, params?: object) => {
  try {
    const result = await apiClient.get(path, { params });
    return result;
  } catch (error) {
    return handleRequestError(error);
  }
};

export const post = async (path: string, data: object) => {
  try {
    const res = await apiClient.post(path, data);
    return res.data;
  } catch (error) {
    const response = handleRequestError(error);
    return response?.data;
  }
};

export const patch = async (path: string, data: object) => {
  try {
    const res = await apiClient.patch(path, data);
    return res;
  } catch (error) {
    return handleRequestError(error);
  }
};

export const deleteData = async (path: string) => {
  try {
    const res = await apiClient.delete(path);
    return res;
  } catch (error) {
    return handleRequestError(error);
  }
};

export const upImage = async (path: string, data: object) => {
  try {
    const response = await apiClient.post(path, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response;
  } catch (error) {
    return handleRequestError(error);
  }
};