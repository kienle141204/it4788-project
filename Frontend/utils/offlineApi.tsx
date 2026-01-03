import { postAccess, patchAccess, deleteAccess } from './api';
import { isNetworkAvailable } from './network';
import { addToQueue } from './requestQueue';
import { getCache, setCache, generateCacheKey, clearCacheByPattern } from './cache';

/**
 * Optimistic update options
 */
export interface OptimisticUpdateOptions {
  cacheKey?: string;
  cachePattern?: string; // Pattern to clear related caches
  transformResponse?: (data: any) => any; // Transform response before caching
  mergeStrategy?: 'replace' | 'append' | 'update'; // How to merge with existing cache
}

/**
 * Post with optimistic update support
 */
export const postOffline = async (
  path: string,
  data: object,
  options: OptimisticUpdateOptions = {}
): Promise<any> => {
  const { cacheKey, cachePattern, transformResponse, mergeStrategy = 'replace' } = options;
  const networkAvailable = isNetworkAvailable();

  try {
    // If online, try to send immediately
    if (networkAvailable) {
      const response = await postAccess(path, data);
      
      // Update cache if cacheKey provided
      if (cacheKey && response) {
        const transformedData = transformResponse ? transformResponse(response) : response;
        await setCache(cacheKey, transformedData);
      }
      
      // Clear related caches if pattern provided
      if (cachePattern) {
        await clearCacheByPattern(cachePattern);
      }
      
      return response;
    }
  } catch (error: any) {
    // If network error and we're offline, continue to queue
    const isNetworkError = 
      !networkAvailable ||
      error?.code === 'ERR_NETWORK' ||
      error?.message?.includes('Network') ||
      !error?.response;
    
    if (!isNetworkError) {
      // Not a network error, throw it
      throw error;
    }
  }

  // Offline or network error - queue request
  const requestId = await addToQueue('POST', path, data);
  
  // Optimistic update: update cache immediately if possible
  if (cacheKey) {
    try {
      const existingData = await getCache(cacheKey);
      const optimisticData = transformResponse ? transformResponse(data) : data;
      
      if (mergeStrategy === 'append' && Array.isArray(existingData)) {
        // Append to array
        const newData = [...existingData, optimisticData];
        await setCache(cacheKey, newData);
      } else if (mergeStrategy === 'update' && existingData && typeof existingData === 'object') {
        // Merge with existing object
        const newData = { ...existingData, ...optimisticData };
        await setCache(cacheKey, newData);
      } else {
        // Replace
        await setCache(cacheKey, optimisticData);
      }
    } catch (cacheError) {
      console.warn('[OfflineAPI] Error updating cache optimistically:', cacheError);
    }
  }
  
  // Clear related caches
  if (cachePattern) {
    await clearCacheByPattern(cachePattern);
  }

  // Return optimistic response
  return {
    success: true,
    message: 'Request queued for offline sync',
    queued: true,
    requestId,
    data: transformResponse ? transformResponse(data) : data,
  };
};

/**
 * Patch with optimistic update support
 */
export const patchOffline = async (
  path: string,
  data: object,
  options: OptimisticUpdateOptions = {}
): Promise<any> => {
  const { cacheKey, cachePattern, transformResponse, mergeStrategy = 'update' } = options;
  const networkAvailable = isNetworkAvailable();

  try {
    // If online, try to send immediately
    if (networkAvailable) {
      const response = await patchAccess(path, data);
      
      // Update cache if cacheKey provided
      if (cacheKey && response) {
        const transformedData = transformResponse ? transformResponse(response) : response;
        await setCache(cacheKey, transformedData);
      }
      
      // Clear related caches if pattern provided
      if (cachePattern) {
        await clearCacheByPattern(cachePattern);
      }
      
      return response;
    }
  } catch (error: any) {
    // If network error and we're offline, continue to queue
    const isNetworkError = 
      !networkAvailable ||
      error?.code === 'ERR_NETWORK' ||
      error?.message?.includes('Network') ||
      !error?.response;
    
    if (!isNetworkError) {
      throw error;
    }
  }

  // Offline or network error - queue request
  const requestId = await addToQueue('PATCH', path, data);
  
  // Optimistic update: update cache immediately if possible
  if (cacheKey) {
    try {
      const existingData = await getCache(cacheKey);
      const optimisticData = transformResponse ? transformResponse(data) : data;
      
      if (mergeStrategy === 'update' && existingData && typeof existingData === 'object') {
        // Merge with existing object
        const newData = { ...existingData, ...optimisticData };
        await setCache(cacheKey, newData);
      } else if (Array.isArray(existingData) && mergeStrategy === 'update') {
        // Update item in array (assuming data has id)
        const updatedArray = existingData.map((item: any) => 
          item.id === (optimisticData as any).id ? { ...item, ...optimisticData } : item
        );
        await setCache(cacheKey, updatedArray);
      } else {
        // Replace
        await setCache(cacheKey, optimisticData);
      }
    } catch (cacheError) {
      console.warn('[OfflineAPI] Error updating cache optimistically:', cacheError);
    }
  }
  
  // Clear related caches
  if (cachePattern) {
    await clearCacheByPattern(cachePattern);
  }

  // Return optimistic response
  return {
    success: true,
    message: 'Request queued for offline sync',
    queued: true,
    requestId,
    data: transformResponse ? transformResponse(data) : data,
  };
};

/**
 * Delete with optimistic update support
 */
export const deleteOffline = async (
  path: string,
  options: OptimisticUpdateOptions = {}
): Promise<any> => {
  const { cacheKey, cachePattern } = options;
  const networkAvailable = isNetworkAvailable();

  try {
    // If online, try to send immediately
    if (networkAvailable) {
      const response = await deleteAccess(path);
      
      // Remove from cache if cacheKey provided
      if (cacheKey) {
        await setCache(cacheKey, null);
      }
      
      // Clear related caches if pattern provided
      if (cachePattern) {
        await clearCacheByPattern(cachePattern);
      }
      
      return response;
    }
  } catch (error: any) {
    // If network error and we're offline, continue to queue
    const isNetworkError = 
      !networkAvailable ||
      error?.code === 'ERR_NETWORK' ||
      error?.message?.includes('Network') ||
      !error?.response;
    
    if (!isNetworkError) {
      throw error;
    }
  }

  // Offline or network error - queue request
  const requestId = await addToQueue('DELETE', path);
  
  // Optimistic update: remove from cache immediately if possible
  if (cacheKey) {
    try {
      const existingData = await getCache(cacheKey);
      
      if (Array.isArray(existingData)) {
        // Extract ID from path (assuming format like "items/123")
        const pathParts = path.split('/');
        const itemId = pathParts[pathParts.length - 1];
        const id = parseInt(itemId, 10) || itemId;
        
        // Remove item from array
        const filteredArray = existingData.filter((item: any) => 
          item.id !== id && item.id?.toString() !== itemId
        );
        await setCache(cacheKey, filteredArray);
      } else {
        // Clear entire cache
        await setCache(cacheKey, null);
      }
    } catch (cacheError) {
      console.warn('[OfflineAPI] Error updating cache optimistically:', cacheError);
    }
  }
  
  // Clear related caches
  if (cachePattern) {
    await clearCacheByPattern(cachePattern);
  }

  // Return optimistic response
  return {
    success: true,
    message: 'Request queued for offline sync',
    queued: true,
    requestId,
  };
};

/**
 * Helper to generate cache key from path and params
 */
export const getCacheKeyForPath = (path: string, params?: object): string => {
  return generateCacheKey(path, params);
};

