import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'cache:';
const CACHE_META_PREFIX = 'cache_meta:';
const MAX_CACHE_SIZE = 10 * 1024 * 1024; // 10MB limit

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
}

interface CacheMetadata {
  size: number;
  key: string;
}

/**
 * Generate cache key from path and params
 */
export const generateCacheKey = (path: string, params?: object): string => {
  const paramsStr = params ? JSON.stringify(params, Object.keys(params).sort()) : '';
  const hash = paramsStr ? btoa(paramsStr).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16) : '';
  return `${CACHE_PREFIX}${path}:${hash}`;
};

/**
 * Deep compare two objects/arrays
 */
export const deepCompare = <T>(obj1: T, obj2: T): boolean => {
  try {
    // Handle null/undefined
    if (obj1 === obj2) return true;
    if (obj1 == null || obj2 == null) return false;
    if (typeof obj1 !== typeof obj2) return false;

    // Handle primitives
    if (typeof obj1 !== 'object') return obj1 === obj2;

    // Handle arrays
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      if (obj1.length !== obj2.length) return false;
      for (let i = 0; i < obj1.length; i++) {
        if (!deepCompare(obj1[i], obj2[i])) return false;
      }
      return true;
    }

    // Handle objects
    if (Array.isArray(obj1) || Array.isArray(obj2)) return false;

    const keys1 = Object.keys(obj1 as object);
    const keys2 = Object.keys(obj2 as object);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!deepCompare((obj1 as any)[key], (obj2 as any)[key])) return false;
    }

    return true;
  } catch (error) {
    // If comparison fails, assume different
    return false;
  }
};

/**
 * Get cached data
 */
export const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    const cacheKey = key.startsWith(CACHE_PREFIX) ? key : `${CACHE_PREFIX}${key}`;
    const cached = await AsyncStorage.getItem(cacheKey);
    
    if (!cached) return null;

    const entry: CacheEntry<T> = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is expired
    if (entry.ttl && (now - entry.timestamp) > entry.ttl) {
      await AsyncStorage.removeItem(cacheKey);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.error('[Cache] Error getting cache:', error);
    return null;
  }
};

/**
 * Set cached data
 */
export const setCache = async <T>(
  key: string,
  data: T,
  ttl?: number
): Promise<boolean> => {
  try {
    const cacheKey = key.startsWith(CACHE_PREFIX) ? key : `${CACHE_PREFIX}${key}`;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    const serialized = JSON.stringify(entry);
    const size = new Blob([serialized]).size;

    // Check cache size limit
    const currentSize = await getTotalCacheSize();
    if (currentSize + size > MAX_CACHE_SIZE) {
      // Clear oldest caches if limit exceeded
      await clearOldestCaches(size);
    }

    await AsyncStorage.setItem(cacheKey, serialized);
    return true;
  } catch (error) {
    console.error('[Cache] Error setting cache:', error);
    return false;
  }
};

/**
 * Check if cache is valid (exists and not expired)
 */
export const isCacheValid = async (key: string): Promise<boolean> => {
  try {
    const cacheKey = key.startsWith(CACHE_PREFIX) ? key : `${CACHE_PREFIX}${key}`;
    const cached = await AsyncStorage.getItem(cacheKey);
    
    if (!cached) return false;

    const entry: CacheEntry<any> = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is expired
    if (entry.ttl && (now - entry.timestamp) > entry.ttl) {
      await AsyncStorage.removeItem(cacheKey);
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Clear specific cache or all caches
 */
export const clearCache = async (key?: string): Promise<void> => {
  try {
    if (key) {
      const cacheKey = key.startsWith(CACHE_PREFIX) ? key : `${CACHE_PREFIX}${key}`;
      await AsyncStorage.removeItem(cacheKey);
    } else {
      // Clear all caches
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    }
  } catch (error) {
    console.error('[Cache] Error clearing cache:', error);
  }
};

/**
 * Clear cache by pattern (e.g., all fridge caches)
 */
export const clearCacheByPattern = async (pattern: string): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => 
      k.startsWith(CACHE_PREFIX) && k.includes(pattern)
    );
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
  } catch (error) {
    console.error('[Cache] Error clearing cache by pattern:', error);
  }
};

/**
 * Get total cache size
 */
const getTotalCacheSize = async (): Promise<number> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
    let totalSize = 0;

    for (const key of cacheKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        totalSize += new Blob([value]).size;
      }
    }

    return totalSize;
  } catch (error) {
    return 0;
  }
};

/**
 * Clear oldest caches to make room
 */
const clearOldestCaches = async (requiredSize: number): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
    const entries: Array<{ key: string; timestamp: number }> = [];

    // Get all cache entries with timestamps
    for (const key of cacheKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        try {
          const entry: CacheEntry<any> = JSON.parse(value);
          entries.push({ key, timestamp: entry.timestamp });
        } catch (e) {
          // Invalid entry, remove it
          await AsyncStorage.removeItem(key);
        }
      }
    }

    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a.timestamp - b.timestamp);

    // Remove oldest entries until we have enough space
    let freedSize = 0;
    for (const entry of entries) {
      const value = await AsyncStorage.getItem(entry.key);
      if (value) {
        freedSize += new Blob([value]).size;
        await AsyncStorage.removeItem(entry.key);
        if (freedSize >= requiredSize) {
          break;
        }
      }
    }
  } catch (error) {
    console.error('[Cache] Error clearing oldest caches:', error);
  }
};

/**
 * Cache TTL constants (in milliseconds)
 * Increased for better offline support
 */
export const CACHE_TTL = {
  SHORT: 30 * 60 * 1000,      // 30 minutes (increased from 5 minutes)
  MEDIUM: 2 * 60 * 60 * 1000, // 2 hours (increased from 15 minutes)
  LONG: 4 * 60 * 60 * 1000,   // 4 hours (increased from 30 minutes)
  STATIC: 24 * 60 * 60 * 1000, // 24 hours (increased from 1 hour)
};

