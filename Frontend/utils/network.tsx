import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';
import { Platform } from 'react-native';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: NetInfoStateType;
}

let currentNetworkStatus: NetworkStatus = {
  isConnected: true,
  isInternetReachable: true,
  type: NetInfoStateType.unknown,
};

const networkListeners: Set<(status: NetworkStatus) => void> = new Set();

/**
 * Get current network status (synchronous)
 */
export const getNetworkStatus = (): NetworkStatus => {
  return currentNetworkStatus;
};

/**
 * Check if network is available
 */
export const isNetworkAvailable = (): boolean => {
  return currentNetworkStatus.isConnected && 
         (currentNetworkStatus.isInternetReachable === true || 
          currentNetworkStatus.isInternetReachable === null);
};

/**
 * Hook to monitor network status
 */
export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(currentNetworkStatus);

  useEffect(() => {
    // Get initial state
    NetInfo.fetch().then((state: NetInfoState) => {
      const status: NetworkStatus = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? null,
        type: state.type,
      };
      currentNetworkStatus = status;
      setNetworkStatus(status);
    });

    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const status: NetworkStatus = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? null,
        type: state.type,
      };
      
      // Only update if status actually changed
      if (
        currentNetworkStatus.isConnected !== status.isConnected ||
        currentNetworkStatus.isInternetReachable !== status.isInternetReachable ||
        currentNetworkStatus.type !== status.type
      ) {
        currentNetworkStatus = status;
        setNetworkStatus(status);
        
        // Notify all listeners
        networkListeners.forEach((listener) => listener(status));
      }
    });

    // Add listener
    const listener = (status: NetworkStatus) => {
      setNetworkStatus(status);
    };
    networkListeners.add(listener);

    return () => {
      unsubscribe();
      networkListeners.delete(listener);
    };
  }, []);

  return {
    ...networkStatus,
    isOnline: isNetworkAvailable(),
  };
};

/**
 * Subscribe to network status changes
 * Returns unsubscribe function
 */
export const subscribeToNetworkStatus = (
  callback: (status: NetworkStatus) => void
): (() => void) => {
  networkListeners.add(callback);
  
  // Call immediately with current status
  callback(currentNetworkStatus);
  
  return () => {
    networkListeners.delete(callback);
  };
};

/**
 * Check network connectivity with a test request
 * More reliable than just checking NetInfo
 */
export const checkNetworkConnectivity = async (): Promise<boolean> => {
  try {
    // For web, use a simple fetch to a reliable endpoint
    if (Platform.OS === 'web') {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      try {
        await fetch('https://www.google.com/favicon.ico', {
          method: 'HEAD',
          mode: 'no-cors',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return true;
      } catch {
        clearTimeout(timeoutId);
        return false;
      }
    }
    
    // For native, NetInfo should be sufficient
    const state = await NetInfo.fetch();
    return state.isConnected === true && 
           (state.isInternetReachable === true || state.isInternetReachable === null);
  } catch (error) {
    console.error('[Network] Error checking connectivity:', error);
    return false;
  }
};

