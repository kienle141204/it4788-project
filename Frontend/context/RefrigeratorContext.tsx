import React, { createContext, useCallback, useContext, useEffect, useState, useRef } from 'react';
import {
  connectRefrigeratorSocket,
  disconnectRefrigeratorSocket,
  getRefrigeratorSocket,
  joinRefrigeratorFamily,
  leaveRefrigeratorFamily,
  onRefrigeratorEvent,
} from '@/utils/socket';
import { clearCacheByPattern } from '@/utils/cache';

interface RefrigeratorContextValue {
  isConnected: boolean;
  joinFamily: (familyId: number) => Promise<void>;
  leaveFamily: (familyId: number) => Promise<void>;
  onIngredientAdded: (callback: (data: { refrigeratorId: number; ingredient: any; message: string }) => void) => () => void;
  onIngredientUpdated: (callback: (data: { refrigeratorId: number; ingredient: any; message: string }) => void) => () => void;
  onIngredientDeleted: (callback: (data: { refrigeratorId: number; ingredientId: number; message: string }) => void) => () => void;
  onDishAdded: (callback: (data: { refrigeratorId: number; dish: any; message: string }) => void) => () => void;
  onDishUpdated: (callback: (data: { refrigeratorId: number; dish: any; message: string }) => void) => () => void;
  onDishDeleted: (callback: (data: { refrigeratorId: number; dishId: number; message: string }) => void) => () => void;
  onExpirationWarning: (callback: (data: { refrigeratorId: number; items: any[]; message: string }) => void) => () => void;
}

const RefrigeratorContext = createContext<RefrigeratorContextValue | undefined>(undefined);

export const RefrigeratorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const joinedFamiliesRef = useRef<Set<number>>(new Set());
  const eventUnsubscribersRef = useRef<Array<() => void>>([]);

  // Connect socket on mount
  useEffect(() => {
    const connect = async () => {
      try {
        await connectRefrigeratorSocket();
        const socket = getRefrigeratorSocket();
        if (socket) {
          setIsConnected(socket.connected);
          
          socket.on('connect', () => {
            setIsConnected(true);
            console.log('[RefrigeratorContext] Socket connected');
          });

          socket.on('disconnect', () => {
            setIsConnected(false);
            console.log('[RefrigeratorContext] Socket disconnected');
          });
        }
      } catch (error) {
        console.error('[RefrigeratorContext] Error connecting socket:', error);
      }
    };

    connect();

    return () => {
      // Cleanup: disconnect socket
      disconnectRefrigeratorSocket();
      setIsConnected(false);
      joinedFamiliesRef.current.clear();
    };
  }, []);

  const joinFamily = useCallback(async (familyId: number) => {
    if (joinedFamiliesRef.current.has(familyId)) {
      return;
    }

    try {
      const result = await joinRefrigeratorFamily(familyId);
      if (result.success) {
        joinedFamiliesRef.current.add(familyId);
        console.log(`[RefrigeratorContext] Joined family ${familyId}`);
      }
    } catch (error) {
      console.error(`[RefrigeratorContext] Error joining family ${familyId}:`, error);
    }
  }, []);

  const leaveFamily = useCallback(async (familyId: number) => {
    if (!joinedFamiliesRef.current.has(familyId)) {
      return;
    }

    try {
      await leaveRefrigeratorFamily(familyId);
      joinedFamiliesRef.current.delete(familyId);
      console.log(`[RefrigeratorContext] Left family ${familyId}`);
    } catch (error) {
      console.error(`[RefrigeratorContext] Error leaving family ${familyId}:`, error);
    }
  }, []);

  const onIngredientAdded = useCallback((callback: (data: { refrigeratorId: number; ingredient: any; message: string }) => void) => {
    const unsubscribe = onRefrigeratorEvent('fridge_ingredient_added', (data) => {
      console.log('[RefrigeratorContext] Ingredient added:', data);
      // Invalidate cache
      if (data.refrigeratorId) {
        clearCacheByPattern(`fridge:${data.refrigeratorId}`);
        clearCacheByPattern(`fridge:${data.refrigeratorId}:ingredients`);
      }
      clearCacheByPattern('fridge:list');
      callback(data);
    });
    eventUnsubscribersRef.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  const onIngredientUpdated = useCallback((callback: (data: { refrigeratorId: number; ingredient: any; message: string }) => void) => {
    const unsubscribe = onRefrigeratorEvent('fridge_ingredient_updated', (data) => {
      console.log('[RefrigeratorContext] Ingredient updated:', data);
      // Invalidate cache
      if (data.refrigeratorId) {
        clearCacheByPattern(`fridge:${data.refrigeratorId}`);
        clearCacheByPattern(`fridge:${data.refrigeratorId}:ingredients`);
      }
      clearCacheByPattern('fridge:list');
      callback(data);
    });
    eventUnsubscribersRef.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  const onIngredientDeleted = useCallback((callback: (data: { refrigeratorId: number; ingredientId: number; message: string }) => void) => {
    const unsubscribe = onRefrigeratorEvent('fridge_ingredient_deleted', (data) => {
      console.log('[RefrigeratorContext] Ingredient deleted:', data);
      // Invalidate cache
      if (data.refrigeratorId) {
        clearCacheByPattern(`fridge:${data.refrigeratorId}`);
        clearCacheByPattern(`fridge:${data.refrigeratorId}:ingredients`);
      }
      clearCacheByPattern('fridge:list');
      callback(data);
    });
    eventUnsubscribersRef.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  const onDishAdded = useCallback((callback: (data: { refrigeratorId: number; dish: any; message: string }) => void) => {
    const unsubscribe = onRefrigeratorEvent('fridge_dish_added', (data) => {
      console.log('[RefrigeratorContext] Dish added:', data);
      // Invalidate cache
      if (data.refrigeratorId) {
        clearCacheByPattern(`fridge:${data.refrigeratorId}`);
        clearCacheByPattern(`fridge:${data.refrigeratorId}:dishes`);
      }
      clearCacheByPattern('fridge:list');
      callback(data);
    });
    eventUnsubscribersRef.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  const onDishUpdated = useCallback((callback: (data: { refrigeratorId: number; dish: any; message: string }) => void) => {
    const unsubscribe = onRefrigeratorEvent('fridge_dish_updated', (data) => {
      console.log('[RefrigeratorContext] Dish updated:', data);
      // Invalidate cache
      if (data.refrigeratorId) {
        clearCacheByPattern(`fridge:${data.refrigeratorId}`);
        clearCacheByPattern(`fridge:${data.refrigeratorId}:dishes`);
      }
      clearCacheByPattern('fridge:list');
      callback(data);
    });
    eventUnsubscribersRef.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  const onDishDeleted = useCallback((callback: (data: { refrigeratorId: number; dishId: number; message: string }) => void) => {
    const unsubscribe = onRefrigeratorEvent('fridge_dish_deleted', (data) => {
      console.log('[RefrigeratorContext] Dish deleted:', data);
      // Invalidate cache
      if (data.refrigeratorId) {
        clearCacheByPattern(`fridge:${data.refrigeratorId}`);
        clearCacheByPattern(`fridge:${data.refrigeratorId}:dishes`);
      }
      clearCacheByPattern('fridge:list');
      callback(data);
    });
    eventUnsubscribersRef.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  const onExpirationWarning = useCallback((callback: (data: { refrigeratorId: number; items: any[]; message: string }) => void) => {
    const unsubscribe = onRefrigeratorEvent('fridge_expiration_warning', (data) => {
      console.log('[RefrigeratorContext] Expiration warning:', data);
      callback(data);
    });
    eventUnsubscribersRef.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  const value: RefrigeratorContextValue = {
    isConnected,
    joinFamily,
    leaveFamily,
    onIngredientAdded,
    onIngredientUpdated,
    onIngredientDeleted,
    onDishAdded,
    onDishUpdated,
    onDishDeleted,
    onExpirationWarning,
  };

  return (
    <RefrigeratorContext.Provider value={value}>
      {children}
    </RefrigeratorContext.Provider>
  );
};

export const useRefrigerator = (): RefrigeratorContextValue => {
  const context = useContext(RefrigeratorContext);
  if (!context) {
    throw new Error('useRefrigerator must be used within RefrigeratorProvider');
  }
  return context;
};

