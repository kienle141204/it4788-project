import React, { createContext, useCallback, useContext, useEffect, useState, useRef } from 'react';
import {
  connectMenuSocket,
  disconnectMenuSocket,
  getMenuSocket,
  joinMenuFamily,
  leaveMenuFamily,
  onMenuEvent,
} from '@/utils/socket';
import { clearCacheByPattern } from '@/utils/cache';

interface MenuContextValue {
  isConnected: boolean;
  joinFamily: (familyId: number) => Promise<void>;
  leaveFamily: (familyId: number) => Promise<void>;
  onMenuCreated: (callback: (data: { menu: any; message: string }) => void) => () => void;
  onMenuUpdated: (callback: (data: { menu: any; message: string }) => void) => () => void;
  onMenuDeleted: (callback: (data: { menuId: number; message: string }) => void) => () => void;
  onDishAdded: (callback: (data: { menuId: number; menuDish: any; message: string }) => void) => () => void;
  onDishUpdated: (callback: (data: { menuId: number; menuDish: any; message: string }) => void) => () => void;
  onDishRemoved: (callback: (data: { menuId: number; menuDishId: number; message: string }) => void) => () => void;
  onMenuReminder: (callback: (data: { menu: any; message: string }) => void) => () => void;
}

const MenuContext = createContext<MenuContextValue | undefined>(undefined);

export const MenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const joinedFamiliesRef = useRef<Set<number>>(new Set());
  const eventUnsubscribersRef = useRef<Array<() => void>>([]);

  // Connect socket on mount
  useEffect(() => {
    const connect = async () => {
      try {
        await connectMenuSocket();
        const socket = getMenuSocket();
        if (socket) {
          setIsConnected(socket.connected);
          
          socket.on('connect', () => {
            setIsConnected(true);
            console.log('[MenuContext] Socket connected');
          });

          socket.on('disconnect', () => {
            setIsConnected(false);
            console.log('[MenuContext] Socket disconnected');
          });
        }
      } catch (error) {
        console.error('[MenuContext] Error connecting socket:', error);
      }
    };

    connect();

    return () => {
      // Cleanup: disconnect socket
      disconnectMenuSocket();
      setIsConnected(false);
      joinedFamiliesRef.current.clear();
    };
  }, []);

  const joinFamily = useCallback(async (familyId: number) => {
    if (joinedFamiliesRef.current.has(familyId)) {
      return;
    }

    try {
      const result = await joinMenuFamily(familyId);
      if (result.success) {
        joinedFamiliesRef.current.add(familyId);
        console.log(`[MenuContext] Joined family ${familyId}`);
      }
    } catch (error) {
      console.error(`[MenuContext] Error joining family ${familyId}:`, error);
    }
  }, []);

  const leaveFamily = useCallback(async (familyId: number) => {
    if (!joinedFamiliesRef.current.has(familyId)) {
      return;
    }

    try {
      await leaveMenuFamily(familyId);
      joinedFamiliesRef.current.delete(familyId);
      console.log(`[MenuContext] Left family ${familyId}`);
    } catch (error) {
      console.error(`[MenuContext] Error leaving family ${familyId}:`, error);
    }
  }, []);

  const onMenuCreated = useCallback((callback: (data: { menu: any; message: string }) => void) => {
    const unsubscribe = onMenuEvent('menu_created', (data) => {
      console.log('[MenuContext] Menu created:', data);
      // Invalidate cache
      clearCacheByPattern('meal:menus');
      clearCacheByPattern('meal:menu:*');
      callback(data);
    });
    eventUnsubscribersRef.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  const onMenuUpdated = useCallback((callback: (data: { menu: any; message: string }) => void) => {
    const unsubscribe = onMenuEvent('menu_updated', (data) => {
      console.log('[MenuContext] Menu updated:', data);
      // Invalidate cache
      if (data.menu?.id) {
        clearCacheByPattern(`meal:menu:${data.menu.id}`);
      }
      clearCacheByPattern('meal:menus');
      callback(data);
    });
    eventUnsubscribersRef.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  const onMenuDeleted = useCallback((callback: (data: { menuId: number; message: string }) => void) => {
    const unsubscribe = onMenuEvent('menu_deleted', (data) => {
      console.log('[MenuContext] Menu deleted:', data);
      // Invalidate cache
      if (data.menuId) {
        clearCacheByPattern(`meal:menu:${data.menuId}`);
      }
      clearCacheByPattern('meal:menus');
      callback(data);
    });
    eventUnsubscribersRef.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  const onDishAdded = useCallback((callback: (data: { menuId: number; menuDish: any; message: string }) => void) => {
    const unsubscribe = onMenuEvent('menu_dish_added', (data) => {
      console.log('[MenuContext] Menu dish added:', data);
      // Invalidate cache
      if (data.menuId) {
        clearCacheByPattern(`meal:menu:${data.menuId}`);
      }
      clearCacheByPattern('meal:menus');
      callback(data);
    });
    eventUnsubscribersRef.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  const onDishUpdated = useCallback((callback: (data: { menuId: number; menuDish: any; message: string }) => void) => {
    const unsubscribe = onMenuEvent('menu_dish_updated', (data) => {
      console.log('[MenuContext] Menu dish updated:', data);
      // Invalidate cache
      if (data.menuId) {
        clearCacheByPattern(`meal:menu:${data.menuId}`);
      }
      clearCacheByPattern('meal:menus');
      callback(data);
    });
    eventUnsubscribersRef.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  const onDishRemoved = useCallback((callback: (data: { menuId: number; menuDishId: number; message: string }) => void) => {
    const unsubscribe = onMenuEvent('menu_dish_removed', (data) => {
      console.log('[MenuContext] Menu dish removed:', data);
      // Invalidate cache
      if (data.menuId) {
        clearCacheByPattern(`meal:menu:${data.menuId}`);
      }
      clearCacheByPattern('meal:menus');
      callback(data);
    });
    eventUnsubscribersRef.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  const onMenuReminder = useCallback((callback: (data: { menu: any; message: string }) => void) => {
    const unsubscribe = onMenuEvent('menu_reminder', (data) => {
      console.log('[MenuContext] Menu reminder:', data);
      callback(data);
    });
    eventUnsubscribersRef.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  const value: MenuContextValue = {
    isConnected,
    joinFamily,
    leaveFamily,
    onMenuCreated,
    onMenuUpdated,
    onMenuDeleted,
    onDishAdded,
    onDishUpdated,
    onDishRemoved,
    onMenuReminder,
  };

  return (
    <MenuContext.Provider value={value}>
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = (): MenuContextValue => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within MenuProvider');
  }
  return context;
};

