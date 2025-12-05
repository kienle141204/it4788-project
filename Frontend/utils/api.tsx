import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';


// const API_DOMAIN = process.env.API || 'http://10.0.2.2:8090/api/'
const REFRESH_THRESHOLD_SECONDS = 5 * 60;
const config = {
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
    },
}
export const get = async (path: String) => {
    try {
        const result = await axios.get(API_DOMAIN + path, { withCredentials: true });
        return result;
    } catch (e){
        if(e) {
            console.log(e)
        }
        else {
            console.log("Network connect failed")
        }
    }
}

export const post = async (path: string, data: object) => {
  try {
    const res = await axios.post(API_DOMAIN + path, data, config);
    return res.data; 
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.log('API Error:', error.response?.data || error.message);
      return error.response?.data; 
    } else {
      console.error('Unknown error:', error);
      throw error;
    }
  }
};


export const patch = async (path: String, data: object) => {
    try{
        const res = await axios.patch(API_DOMAIN +path, data, config)
        return res
    } catch (e) {
        return e; 
    }
}

const API_DOMAIN = process.env.API || 'http://localhost:8090/api/';
export const deleteData = async (path: String) => {
    try{
        const res = await axios.delete(API_DOMAIN + path)
        return res
    } catch (e) {
        console.log(e)
    }
}




export const upImage = async (path: String, data: object) => {
    try{
        const response = await axios.post(API_DOMAIN + path, data, { headers: { 'Content-Type': 'multipart/form-data' } })
        return response
    } catch(e) {
        console.log(e)
    }
}



// Helper to decode JWT without verification (just to check expiration)
const decodeJWT = (token: string) => {
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
    console.warn('⚠️ No access token found in AsyncStorage');
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
    
    console.log('🔑 Token header created:', {
      hasToken: !!token,
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 20) + '...',
      headerFormat: authHeader.Authorization.substring(0, 25) + '...',
      isExpired,
      expiresIn: timeUntilExpiry ? `${Math.floor(timeUntilExpiry / 60)} minutes` : 'unknown',
      payload: { sub: decoded.sub, email: decoded.email }
    });
    
    if (isExpired) {
      console.error('⚠️ Token has expired! Need to refresh or re-login.');
    }
  } else {
    console.warn('⚠️ Could not decode token - may be invalid format');
  }
  
  return authHeader;
};

// Helper to refresh token and update AsyncStorage
const refreshAccessToken = async (): Promise<boolean> => {
  const refresh_token = await AsyncStorage.getItem('refresh_token');
  if (!refresh_token) {
    console.error('⚠️ No refresh token found');
    await logoutUser();
    throw new Error('SESSION_EXPIRED');
  }

  try {
    console.log('🔄 Attempting to refresh token...');
    const response = await axios.post(API_DOMAIN + 'auth/refresh-token', {
      refresh_token: refresh_token.startsWith('Bearer ') ? refresh_token.substring(7) : refresh_token
    }, config);

    if (response.data && response.data.access_token && response.data.refresh_token) {
      await AsyncStorage.setItem('access_token', response.data.access_token);
      await AsyncStorage.setItem('refresh_token', response.data.refresh_token);
      console.log('✅ Token refreshed successfully');
      return true;
    }

    console.error('❌ Refresh token response is invalid');
    await logoutUser();
    throw new Error('SESSION_EXPIRED');
  } catch (error: any) {
    console.error('❌ Failed to refresh token:', error.response?.data || error.message);
    await logoutUser();
    throw new Error('SESSION_EXPIRED');
  }
};

const ensureTokenValid = async (): Promise<boolean> => {
  const token = await AsyncStorage.getItem('access_token');
  if (!token) {
    console.warn('⚠️ No access token found when validating');
    await logoutUser();
    throw new Error('SESSION_EXPIRED');
  }

  const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
  const decoded = decodeJWT(cleanToken);
  if (!decoded || !decoded.exp) {
    console.warn('⚠️ Invalid token payload, forcing logout');
    await logoutUser();
    throw new Error('SESSION_EXPIRED');
  }

  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = decoded.exp - now;

  if (timeUntilExpiry <= 0) {
    console.warn('⚠️ Token already expired, refreshing...');
    await refreshAccessToken();
    return true;
  }

  if (timeUntilExpiry < REFRESH_THRESHOLD_SECONDS) {
    console.log(`🔄 Token expires in ${timeUntilExpiry}s, refreshing early...`);
    await refreshAccessToken();
  }

  return true;
};

export const getAccess = async (path: string, params: object = {}, retryCount = 0) : Promise<any> =>  {
  console.log('getAccess called:', { path, params, retryCount });
  let tokenHeader = {};
  try {
    await ensureTokenValid();
    tokenHeader = await getTokenHeader();
    console.log('Making API request to:', API_DOMAIN + path, 'with params:', params, 'and headers:', tokenHeader);
    const result = await axios.get(API_DOMAIN + path, {
      ...config,
      headers: { ...config.headers, ...tokenHeader },
      params,
    });
    console.log('API response received:', result.data);
    return result.data;
  } catch (error: any) {
    console.error('getAccess error:', error?.response?.data || error?.message || error);
    if (error instanceof Error && error.message === 'SESSION_EXPIRED') {
      throw error;
    }
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401 && retryCount === 0) {
        console.log('🔄 Token expired, attempting to refresh...');
        await refreshAccessToken();
        return getAccess(path, params, retryCount + 1);
      }
      if (error.response?.status === 401) {
        console.error('Unauthorized - Token may be invalid or expired:', error.response?.data);
        console.error('Token header:', tokenHeader);
        console.error('Request URL:', API_DOMAIN + path);
      }
      console.log('API Error:', error.response?.data || error.message);
      throw error;
    } else {
      console.error('Unknown error:', error);
      throw error;
    }
  }
};


export const postAccess = async (path: string, data: object, retryCount = 0) : Promise<any> => {
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
        console.log('🔄 Token expired, attempting to refresh...');
        await refreshAccessToken();
        return postAccess(path, data, retryCount + 1);
      }
      if (error.response?.status === 401) {
        console.error('Unauthorized - Token may be invalid or expired:', error.response?.data);
        console.error('Token header:', tokenHeader);
        console.error('Request URL:', API_DOMAIN + path);
      }
      console.log('API Error:', error.response?.data || error.message);
      throw error;
    } else {
      console.error('Unknown error:', error);
      throw error;
    }
  }
};

export const patchAccess = async (path: string, data: object, retryCount = 0) : Promise<any> => {
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
        console.log('🔄 Token expired, attempting to refresh...');
        await refreshAccessToken();
        return patchAccess(path, data, retryCount + 1);
      }
      if (error.response?.status === 401) {
        console.error('Unauthorized - Token may be invalid or expired:', error.response?.data);
        console.error('Token header:', tokenHeader);
        console.error('Request URL:', API_DOMAIN + path);
      }
      console.log('API Error:', error.response?.data || error.message);
      throw error;
    } else {
      console.error('Unknown error:', error);
      throw error;
    }
  }
};

export const deleteAccess = async (path: string, retryCount = 0) : Promise<any> => {
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
        console.log('🔄 Token expired, attempting to refresh...');
        await refreshAccessToken();
        return deleteAccess(path, retryCount + 1);
      }
      if (error.response?.status === 401) {
        console.error('Unauthorized - Token may be invalid or expired:', error.response?.data);
        console.error('Token header:', tokenHeader);
        console.error('Request URL:', API_DOMAIN + path);
      }
      console.log('API Error:', error.response?.data || error.message);
      throw error;
    } else {
      console.error('Unknown error:', error);
      throw error;
    }
  }
};
