import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_DOMAIN, getTokenHeader, ensureTokenValid } from './api';
import { isNetworkAvailable } from './network';

const QUEUE_STORAGE_KEY = 'request_queue';
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second base delay

export interface QueuedRequest {
  id: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  path: string;
  data?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retries: number;
  maxRetries?: number;
}

interface QueueStatus {
  total: number;
  pending: number;
  failed: number;
}

/**
 * Generate unique ID for queued request
 */
const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get all queued requests from storage
 */
export const getQueuedRequests = async (): Promise<QueuedRequest[]> => {
  try {
    const queueData = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
    if (!queueData) return [];
    
    const requests: QueuedRequest[] = JSON.parse(queueData);
    return requests;
  } catch (error) {
    console.error('[RequestQueue] Error getting queued requests:', error);
    return [];
  }
};

/**
 * Save queued requests to storage
 */
const saveQueuedRequests = async (requests: QueuedRequest[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(requests));
  } catch (error) {
    console.error('[RequestQueue] Error saving queued requests:', error);
  }
};

/**
 * Add request to queue
 */
export const addToQueue = async (
  method: 'POST' | 'PATCH' | 'DELETE',
  path: string,
  data?: any,
  headers?: Record<string, string>
): Promise<string> => {
  const request: QueuedRequest = {
    id: generateRequestId(),
    method,
    path,
    data,
    headers,
    timestamp: Date.now(),
    retries: 0,
    maxRetries: MAX_RETRIES,
  };

  const requests = await getQueuedRequests();
  requests.push(request);
  await saveQueuedRequests(requests);

  console.log(`[RequestQueue] Added ${method} ${path} to queue (ID: ${request.id})`);
  return request.id;
};

/**
 * Remove request from queue
 */
export const removeFromQueue = async (requestId: string): Promise<void> => {
  const requests = await getQueuedRequests();
  const filtered = requests.filter((req) => req.id !== requestId);
  await saveQueuedRequests(filtered);
};

/**
 * Clear all queued requests
 */
export const clearQueue = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
    console.log('[RequestQueue] Cleared all queued requests');
  } catch (error) {
    console.error('[RequestQueue] Error clearing queue:', error);
  }
};

/**
 * Get queue status
 */
export const getQueueStatus = async (): Promise<QueueStatus> => {
  const requests = await getQueuedRequests();
  const failed = requests.filter((req) => req.retries >= (req.maxRetries || MAX_RETRIES));
  
  return {
    total: requests.length,
    pending: requests.length - failed.length,
    failed: failed.length,
  };
};

/**
 * Execute a single queued request
 * Uses axios directly to avoid circular dependency with api.tsx queue logic
 */
const executeRequest = async (request: QueuedRequest): Promise<boolean> => {
  try {
    // Ensure we have valid token
    await ensureTokenValid();
    const tokenHeader = await getTokenHeader();
    
    const config = {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...tokenHeader,
        ...request.headers,
      },
    };

    let response: any;

    switch (request.method) {
      case 'POST':
        response = await axios.post(API_DOMAIN + request.path, request.data || {}, config);
        break;
      case 'PATCH':
        response = await axios.patch(API_DOMAIN + request.path, request.data || {}, config);
        break;
      case 'DELETE':
        response = await axios.delete(API_DOMAIN + request.path, config);
        break;
      default:
        console.warn(`[RequestQueue] Unknown method: ${request.method}`);
        return false;
    }

    // Check if response indicates success
    const isSuccess = 
      response?.status >= 200 && 
      response?.status < 300 &&
      response?.data !== undefined;

    if (isSuccess) {
      console.log(`[RequestQueue] Successfully executed ${request.method} ${request.path} (ID: ${request.id})`);
      return true;
    } else {
      console.warn(`[RequestQueue] Request failed: ${request.method} ${request.path}`, response);
      return false;
    }
  } catch (error: any) {
    // Check if it's a network error
    const isNetworkError = 
      error?.code === 'ERR_NETWORK' ||
      error?.message?.includes('Network') ||
      error?.message?.includes('network') ||
      error?.message?.includes('ECONNREFUSED') ||
      error?.message?.includes('timeout') ||
      !error?.response;

    if (isNetworkError) {
      console.log(`[RequestQueue] Network error for ${request.method} ${request.path}, will retry later`);
      return false;
    }

    // Handle 401 Unauthorized - token might be expired, but we'll let it retry
    if (error?.response?.status === 401) {
      console.warn(`[RequestQueue] Unauthorized for ${request.method} ${request.path}, will retry`);
      return false;
    }

    // For other client errors (4xx), remove from queue
    const statusCode = error?.response?.status;
    if (statusCode >= 400 && statusCode < 500 && statusCode !== 401) {
      // Client errors (4xx) except 401 - probably won't succeed on retry
      console.warn(`[RequestQueue] Client error ${statusCode} for ${request.method} ${request.path}, removing from queue`);
      return true; // Return true to remove from queue
    }

    // For server errors (5xx), keep in queue and retry
    if (statusCode >= 500) {
      console.warn(`[RequestQueue] Server error ${statusCode} for ${request.method} ${request.path}, will retry`);
      return false;
    }

    console.warn(`[RequestQueue] Error executing ${request.method} ${request.path}:`, error?.message || error);
    return false;
  }
};

/**
 * Process queued requests
 * Returns number of successfully processed requests
 */
export const processQueue = async (): Promise<{ success: number; failed: number }> => {
  if (!isNetworkAvailable()) {
    console.log('[RequestQueue] Network not available, skipping queue processing');
    return { success: 0, failed: 0 };
  }

  const requests = await getQueuedRequests();
  if (requests.length === 0) {
    return { success: 0, failed: 0 };
  }

  console.log(`[RequestQueue] Processing ${requests.length} queued requests...`);

  let successCount = 0;
  let failedCount = 0;
  const updatedRequests: QueuedRequest[] = [];

  // Process requests sequentially to avoid race conditions
  for (const request of requests) {
    // Check if request has exceeded max retries
    if (request.retries >= (request.maxRetries || MAX_RETRIES)) {
      console.warn(`[RequestQueue] Request ${request.id} exceeded max retries, skipping`);
      failedCount++;
      // Keep failed requests in queue for manual review (optional: remove them)
      updatedRequests.push(request);
      continue;
    }

    // Calculate exponential backoff delay
    const delay = RETRY_DELAY_BASE * Math.pow(2, request.retries);
    if (request.retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    // Execute request
    const success = await executeRequest(request);

    if (success) {
      successCount++;
      // Remove from queue
      console.log(`[RequestQueue] Removed ${request.method} ${request.path} from queue`);
    } else {
      // Increment retry count and keep in queue
      request.retries++;
      updatedRequests.push(request);
      failedCount++;
      console.log(`[RequestQueue] Request ${request.id} failed, retry count: ${request.retries}/${request.maxRetries || MAX_RETRIES}`);
    }
  }

  // Save updated queue
  await saveQueuedRequests(updatedRequests);

  console.log(`[RequestQueue] Processed queue: ${successCount} succeeded, ${failedCount} failed/retrying`);
  return { success: successCount, failed: failedCount };
};

/**
 * Retry a specific request by ID
 */
export const retryRequest = async (requestId: string): Promise<boolean> => {
  const requests = await getQueuedRequests();
  const request = requests.find((req) => req.id === requestId);
  
  if (!request) {
    console.warn(`[RequestQueue] Request ${requestId} not found`);
    return false;
  }

  if (!isNetworkAvailable()) {
    console.log('[RequestQueue] Network not available for retry');
    return false;
  }

  const success = await executeRequest(request);
  
  if (success) {
    await removeFromQueue(requestId);
    return true;
  } else {
    // Update retry count
    request.retries++;
    const updatedRequests = requests.map((req) => 
      req.id === requestId ? request : req
    );
    await saveQueuedRequests(updatedRequests);
    return false;
  }
};

