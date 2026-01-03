import { useState, useEffect, useCallback, useRef } from 'react';
import { getCachedAccess, refreshCachedAccess, CachedApiOptions } from '../utils/cachedApi';
import { clearCache, clearCacheByPattern } from '../utils/cache';

export interface UseCachedDataOptions extends CachedApiOptions {
  enabled?: boolean; // Whether to fetch data (default: true)
  refetchOnFocus?: boolean; // Refetch when component mounts/focuses (default: true)
  onDataChange?: (data: any, fromCache: boolean) => void; // Callback when data changes
}

export interface UseCachedDataResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  fromCache: boolean;
  refresh: () => Promise<void>;
  clearCache: () => Promise<void>;
}

/**
 * Custom hook for fetching and caching data
 * 
 * @param fetchFn Function that returns a promise with path and params
 * @param cacheKey Cache key for this data
 * @param options Options for caching behavior
 */
export const useCachedData = <T = any>(
  fetchFn: () => Promise<{ path: string; params?: object }>,
  cacheKey: string,
  options: UseCachedDataOptions = {}
): UseCachedDataResult<T> => {
  const {
    ttl,
    skipCache = false,
    compareData = true,
    enabled = true,
    refetchOnFocus = true,
    onDataChange,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [fromCache, setFromCache] = useState<boolean>(false);
  const isMountedRef = useRef(true);
  const fetchInProgressRef = useRef(false);

  // Fetch data function
  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!enabled || fetchInProgressRef.current) return;

    try {
      fetchInProgressRef.current = true;
      
      if (!forceRefresh) {
        setLoading(true);
      }
      setError(null);

      const { path, params = {} } = await fetchFn();

      let result;
      if (forceRefresh) {
        // Force refresh: always fetch from API
        result = await refreshCachedAccess<T>(path, params, {
          ttl,
          cacheKey,
          skipCache,
          compareData,
        });
        setFromCache(false);
      } else {
        // Normal fetch: use cache if available
        result = await getCachedAccess<T>(path, params, {
          ttl,
          cacheKey,
          skipCache,
          compareData,
        });
        setFromCache(result.fromCache);
      }

      if (isMountedRef.current) {
        // Only update if data changed (when compareData is true)
        if (!compareData || result.updated || forceRefresh) {
          setData(result.data);
          if (onDataChange) {
            onDataChange(result.data, result.fromCache);
          }
        } else if (data === null) {
          // First load, always set data
          setData(result.data);
          if (onDataChange) {
            onDataChange(result.data, result.fromCache);
          }
        }
      }

      // If we got data from cache, fetch fresh data in background
      if (result.fromCache && !forceRefresh && !skipCache) {
        refreshCachedAccess<T>(path, params, {
          ttl,
          cacheKey,
          skipCache,
          compareData,
        }).then((freshResult) => {
          if (isMountedRef.current && freshResult.updated) {
            setData(freshResult.data);
            setFromCache(false);
            if (onDataChange) {
              onDataChange(freshResult.data, false);
            }
          }
        }).catch(() => {
          // Silently fail background refresh
        });
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err);
        setData(null);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      fetchInProgressRef.current = false;
    }
  }, [fetchFn, cacheKey, ttl, skipCache, compareData, enabled, onDataChange]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData(false);
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [enabled]);

  // Refresh function
  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // Clear cache function
  const clearCacheFn = useCallback(async () => {
    await clearCache(cacheKey);
    setData(null);
    if (enabled) {
      await fetchData(false);
    }
  }, [cacheKey, enabled, fetchData]);

  return {
    data,
    loading,
    error,
    fromCache,
    refresh,
    clearCache: clearCacheFn,
  };
};

/**
 * Hook to clear cache by pattern
 */
export const useClearCacheByPattern = () => {
  return useCallback(async (pattern: string) => {
    await clearCacheByPattern(pattern);
  }, []);
};

