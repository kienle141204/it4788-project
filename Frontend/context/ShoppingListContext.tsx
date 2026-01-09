import React, { createContext, useCallback, useContext, useEffect, useState, useRef } from 'react';
import {
  connectShoppingListSocket,
  disconnectShoppingListSocket,
  getShoppingListSocket,
  joinShoppingListFamily,
  leaveShoppingListFamily,
  onShoppingListEvent,
} from '@/utils/socket';
import { clearCacheByPattern } from '@/utils/cache';

interface ShoppingListContextValue {
  isConnected: boolean;
  joinFamily: (familyId: number) => Promise<void>;
  leaveFamily: (familyId: number) => Promise<void>;
  onShoppingListCreated: (callback: (data: { shoppingList: any; message: string }) => void) => () => void;
  onShoppingListUpdated: (callback: (data: { shoppingList: any; message: string }) => void) => () => void;
  onShoppingListDeleted: (callback: (data: { listId: number; message: string }) => void) => () => void;
  onShoppingItemAdded: (callback: (data: { listId: number; item: any; message: string }) => void) => () => void;
  onShoppingItemUpdated: (callback: (data: { listId: number; item: any; message: string }) => void) => () => void;
  onShoppingItemDeleted: (callback: (data: { listId: number; itemId: number; message: string }) => void) => () => void;
  onShoppingListShared: (callback: (data: { shoppingList: any; message: string }) => void) => () => void;
}

const ShoppingListContext = createContext<ShoppingListContextValue | undefined>(undefined);

export const ShoppingListProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const joinedFamiliesRef = useRef<Set<number>>(new Set());
  const eventUnsubscribersRef = useRef<Array<() => void>>([]);

  // Connect socket on mount
  useEffect(() => {
    const connect = async () => {
      try {
        await connectShoppingListSocket();
        const socket = getShoppingListSocket();
        if (socket) {
          setIsConnected(socket.connected);
          
          socket.on('connect', () => {
            setIsConnected(true);
            console.log('[ShoppingListContext] Socket connected');
          });

          socket.on('disconnect', () => {
            setIsConnected(false);
            console.log('[ShoppingListContext] Socket disconnected');
          });
        }
      } catch (error) {
        console.error('[ShoppingListContext] Error connecting socket:', error);
      }
    };

    connect();

    return () => {
      // Cleanup: disconnect socket
      disconnectShoppingListSocket();
      setIsConnected(false);
      joinedFamiliesRef.current.clear();
    };
  }, []);

  const joinFamily = useCallback(async (familyId: number) => {
    if (joinedFamiliesRef.current.has(familyId)) {
      return;
    }

    try {
      const result = await joinShoppingListFamily(familyId);
      if (result.success) {
        joinedFamiliesRef.current.add(familyId);
        console.log(`[ShoppingListContext] Joined family ${familyId}`);
      }
    } catch (error) {
      console.error(`[ShoppingListContext] Error joining family ${familyId}:`, error);
    }
  }, []);

  const leaveFamily = useCallback(async (familyId: number) => {
    if (!joinedFamiliesRef.current.has(familyId)) {
      return;
    }

    try {
      await leaveShoppingListFamily(familyId);
      joinedFamiliesRef.current.delete(familyId);
      console.log(`[ShoppingListContext] Left family ${familyId}`);
    } catch (error) {
      console.error(`[ShoppingListContext] Error leaving family ${familyId}:`, error);
    }
  }, []);

  const onShoppingListCreated = useCallback((callback: (data: { shoppingList: any; message: string }) => void) => {
    const unsubscribe = onShoppingListEvent('shopping_list_created', (data) => {
      console.log('[ShoppingListContext] Shopping list created:', data);
      // Invalidate cache
      clearCacheByPattern('shopping-lists');
      clearCacheByPattern('group:family:*:shopping-lists');
      callback(data);
    });
    eventUnsubscribersRef.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  const onShoppingListUpdated = useCallback((callback: (data: { shoppingList: any; message: string }) => void) => {
    const unsubscribe = onShoppingListEvent('shopping_list_updated', (data) => {
      console.log('[ShoppingListContext] Shopping list updated:', data);
      // Invalidate cache
      if (data.shoppingList?.id) {
        clearCacheByPattern(`shopping-lists/${data.shoppingList.id}`);
        clearCacheByPattern(`calendar:shopping-list:${data.shoppingList.id}`);
      }
      clearCacheByPattern('shopping-lists');
      clearCacheByPattern('group:family:*:shopping-lists');
      callback(data);
    });
    eventUnsubscribersRef.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  const onShoppingListDeleted = useCallback((callback: (data: { listId: number; message: string }) => void) => {
    const unsubscribe = onShoppingListEvent('shopping_list_deleted', (data) => {
      console.log('[ShoppingListContext] Shopping list deleted:', data);
      // Invalidate cache
      if (data.listId) {
        clearCacheByPattern(`shopping-lists/${data.listId}`);
        clearCacheByPattern(`calendar:shopping-list:${data.listId}`);
      }
      clearCacheByPattern('shopping-lists');
      clearCacheByPattern('group:family:*:shopping-lists');
      callback(data);
    });
    eventUnsubscribersRef.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  const onShoppingItemAdded = useCallback((callback: (data: { listId: number; item: any; message: string }) => void) => {
    const unsubscribe = onShoppingListEvent('shopping_item_added', (data) => {
      console.log('[ShoppingListContext] Shopping item added:', data);
      // Invalidate cache
      if (data.listId) {
        clearCacheByPattern(`shopping-lists/${data.listId}`);
        clearCacheByPattern(`calendar:shopping-list:${data.listId}`);
      }
      clearCacheByPattern('shopping-lists');
      callback(data);
    });
    eventUnsubscribersRef.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  const onShoppingItemUpdated = useCallback((callback: (data: { listId: number; item: any; message: string }) => void) => {
    const unsubscribe = onShoppingListEvent('shopping_item_updated', (data) => {
      console.log('[ShoppingListContext] Shopping item updated:', data);
      // Invalidate cache
      if (data.listId) {
        clearCacheByPattern(`shopping-lists/${data.listId}`);
        clearCacheByPattern(`calendar:shopping-list:${data.listId}`);
      }
      clearCacheByPattern('shopping-lists');
      callback(data);
    });
    eventUnsubscribersRef.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  const onShoppingItemDeleted = useCallback((callback: (data: { listId: number; itemId: number; message: string }) => void) => {
    const unsubscribe = onShoppingListEvent('shopping_item_deleted', (data) => {
      console.log('[ShoppingListContext] Shopping item deleted:', data);
      // Invalidate cache
      if (data.listId) {
        clearCacheByPattern(`shopping-lists/${data.listId}`);
        clearCacheByPattern(`calendar:shopping-list:${data.listId}`);
      }
      clearCacheByPattern('shopping-lists');
      callback(data);
    });
    eventUnsubscribersRef.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  const onShoppingListShared = useCallback((callback: (data: { shoppingList: any; message: string }) => void) => {
    const unsubscribe = onShoppingListEvent('shopping_list_shared', (data) => {
      console.log('[ShoppingListContext] Shopping list shared:', data);
      // Invalidate cache
      clearCacheByPattern('shopping-lists');
      clearCacheByPattern('group:family:*:shopping-lists');
      callback(data);
    });
    eventUnsubscribersRef.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  const value: ShoppingListContextValue = {
    isConnected,
    joinFamily,
    leaveFamily,
    onShoppingListCreated,
    onShoppingListUpdated,
    onShoppingListDeleted,
    onShoppingItemAdded,
    onShoppingItemUpdated,
    onShoppingItemDeleted,
    onShoppingListShared,
  };

  return (
    <ShoppingListContext.Provider value={value}>
      {children}
    </ShoppingListContext.Provider>
  );
};

export const useShoppingList = (): ShoppingListContextValue => {
  const context = useContext(ShoppingListContext);
  if (!context) {
    throw new Error('useShoppingList must be used within ShoppingListProvider');
  }
  return context;
};

