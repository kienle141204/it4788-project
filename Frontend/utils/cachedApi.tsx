import { getAccess } from './api';
import { getCache, setCache, generateCacheKey, deepCompare, CACHE_TTL, isCacheValid } from './cache';

// Re-export CACHE_TTL for convenience
export { CACHE_TTL };

export interface CachedApiOptions {
  ttl?: number; // Time to live in milliseconds
  cacheKey?: string; // Custom cache key
  skipCache?: boolean; // Skip cache entirely
  compareData?: boolean; // Compare data before updating (default: true)
}

/**
 * Get data with caching support
 * Returns cached data immediately if available, then fetches fresh data in background
 */
export const getCachedAccess = async <T = any>(
  path: string,
  params: object = {},
  options: CachedApiOptions = {}
): Promise<{ data: T; fromCache: boolean; updated: boolean }> => {
  const {
    ttl = CACHE_TTL.MEDIUM,
    cacheKey,
    skipCache = false,
    compareData = true,
  } = options;

  // Generate cache key
  const key = cacheKey || generateCacheKey(path, params);

  // Try to get from cache first (unless skipCache is true)
  if (!skipCache) {
    const cachedData = await getCache<T>(key);
    if (cachedData !== null) {
      // Return cached data immediately
      // Fresh data will be fetched in background if needed
      return {
        data: cachedData,
        fromCache: true,
        updated: false,
      };
    }
  }

  // No cache or skipCache is true, fetch from API
  try {
    const freshData = await getAccess<T>(path, params);

    // Save to cache (only if data is valid)
    if (!skipCache && freshData !== null && freshData !== undefined) {
      await setCache(key, freshData, ttl);
    }

    return {
      data: freshData,
      fromCache: false,
      updated: true,
    };
  } catch (error) {
    // If API fails and we have cache, return cache
    if (!skipCache) {
      const cachedData = await getCache<T>(key);
      if (cachedData !== null) {
        return {
          data: cachedData,
          fromCache: true,
          updated: false,
        };
      }
    }
    // Re-throw error if no cache available
    throw error;
  }
};

/**
 * Get data with cache-first strategy
 * Returns cached data if valid, otherwise fetches from API
 */
export const getCachedAccessSync = async <T = any>(
  path: string,
  params: object = {},
  options: CachedApiOptions = {}
): Promise<T> => {
  const {
    ttl = CACHE_TTL.MEDIUM,
    cacheKey,
    skipCache = false,
  } = options;

  // Generate cache key
  const key = cacheKey || generateCacheKey(path, params);

  // Try cache first
  if (!skipCache) {
    const isValid = await isCacheValid(key);
    if (isValid) {
      const cachedData = await getCache<T>(key);
      if (cachedData !== null) {
        return cachedData;
      }
    }
  }

  // Fetch from API
  const freshData = await getAccess<T>(path, params);

  // Save to cache
  if (!skipCache) {
    await setCache(key, freshData, ttl);
  }

  return freshData;
};

/**
 * Refresh data and update cache
 * Always fetches from API and updates cache
 */
export const refreshCachedAccess = async <T = any>(
  path: string,
  params: object = {},
  options: CachedApiOptions = {}
): Promise<{ data: T; updated: boolean }> => {
  const {
    ttl = CACHE_TTL.MEDIUM,
    cacheKey,
    compareData = true,
  } = options;

  // Generate cache key
  const key = cacheKey || generateCacheKey(path, params);

  // Get old cached data for comparison
  const oldCachedData = await getCache<T>(key);

  // Fetch fresh data
  let freshData: T;
  try {
    freshData = await getAccess<T>(path, params);
  } catch (error) {
    // If API fails, return cached data if available
    if (oldCachedData !== null) {
      return {
        data: oldCachedData,
        updated: false,
      };
    }
    // Re-throw if no cache available
    throw error;
  }

  // Compare data if needed
  let updated = true;
  if (compareData && oldCachedData !== null) {
    updated = !deepCompare(oldCachedData, freshData);
  }

  // Update cache (only if data is valid)
  if (freshData !== null && freshData !== undefined) {
    await setCache(key, freshData, ttl);
  }

  return {
    data: freshData,
    updated,
  };
};

