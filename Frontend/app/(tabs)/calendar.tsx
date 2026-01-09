import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, ScrollView, Alert, Text, ActivityIndicator, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateSelector from '@/components/DateSelector';
import { taskStyles } from '@/styles/task.styles';
import { groupStyles } from '@/styles/group.styles';
import { getMyShoppingLists, getShoppingListById } from '@/service/shopping';
import { toggleItemChecked, type ShoppingItem as ShoppingItemType } from '@/service/shoppingList';
import { COLORS } from '@/constants/themes';
import { getCachedAccess, refreshCachedAccess, CACHE_TTL } from '@/utils/cachedApi';
import { clearCacheByPattern } from '@/utils/cache';
import { useShoppingList } from '@/context/ShoppingListContext';

interface ShoppingList {
  id: number;
  owner_id: number;
  family_id?: number | null;
  shopping_date: string;
  cost: number;
  items?: ShoppingItemType[];
  family?: {
    id: number;
    name: string;
  } | null;
}

export default function TaskPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<number>(today.getDate());
  const [selectedDateFull, setSelectedDateFull] = useState<Date>(today);
  const [loading, setLoading] = useState(true);
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [loadedListIds, setLoadedListIds] = useState<Set<number>>(new Set());

  // Helper function to check if two dates are the same day
  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  // Filter shopping lists by selected date
  const filteredShoppingLists = useMemo(() => {
    return shoppingLists.filter(list => {
      if (!list.shopping_date) return false;
      const listDate = new Date(list.shopping_date);
      return isSameDay(listDate, selectedDateFull);
    });
  }, [shoppingLists, selectedDateFull]);

  const loadShoppingLists = useCallback(async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      
      // Use cached API for better performance
      let lists: any[];
      if (isRefreshing) {
        // Force refresh: always fetch from API
        const result = await refreshCachedAccess<any[]>(
          'shopping-lists/my-list',
          {},
          {
            ttl: CACHE_TTL.MEDIUM,
            cacheKey: 'calendar:shopping-lists',
            compareData: true,
          }
        );
        lists = Array.isArray(result.data) ? result.data : [];
      } else {
        // Normal fetch: use cache if available
        const result = await getCachedAccess<any[]>(
          'shopping-lists/my-list',
          {},
          {
            ttl: CACHE_TTL.MEDIUM,
            cacheKey: 'calendar:shopping-lists',
            compareData: true,
          }
        );
        lists = Array.isArray(result.data) ? result.data : [];
        
        // If we got data from cache, fetch fresh data in background
        if (result.fromCache) {
          refreshCachedAccess<any[]>(
            'shopping-lists/my-list',
            {},
            {
              ttl: CACHE_TTL.MEDIUM,
              cacheKey: 'calendar:shopping-lists',
              compareData: true,
            }
          ).then((freshResult) => {
            if (freshResult.updated) {
              const freshLists = Array.isArray(freshResult.data) ? freshResult.data : [];
              const typedLists: ShoppingList[] = freshLists.map((list: any) => ({
                ...list,
                items: list.items !== undefined ? list.items : undefined,
              }));
              setShoppingLists(typedLists);
            }
          }).catch(() => {
            // Silently fail background refresh
          });
        }
      }

      // Ensure items are properly typed
      // Keep items as undefined if not present, so we know to load them
      const typedLists: ShoppingList[] = (lists || []).map((list: any) => ({
        ...list,
        items: list.items !== undefined ? list.items : undefined,
      }));

      setShoppingLists(typedLists);
      // Reset loaded list IDs when reloading all lists
      setLoadedListIds(new Set());
    } catch (error: any) {
      if (error.message === 'SESSION_EXPIRED' || error.response?.status === 401) {
        Alert.alert('Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại');
        router.push('/(auth)/login');
      } else {
        Alert.alert('Lỗi', 'Không thể tải danh sách mua sắm');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Load shopping lists on mount
  useEffect(() => {
    loadShoppingLists();
  }, [loadShoppingLists]);

  // Reload data when page comes into focus (to sync with group page)
  useFocusEffect(
    useCallback(() => {
      loadShoppingLists(true); // Silent refresh, use cache first
    }, [loadShoppingLists])
  );

  // Real-time shopping list updates
  const shoppingListContext = useShoppingList();

  // Listen to shopping list events
  useEffect(() => {
    const unsubscribers: Array<() => void> = [];

    // Shopping list created
    unsubscribers.push(
      shoppingListContext.onShoppingListCreated(() => {
        loadShoppingLists(true);
      })
    );

    // Shopping list updated
    unsubscribers.push(
      shoppingListContext.onShoppingListUpdated((data) => {
        setShoppingLists((prevLists) => {
          const index = prevLists.findIndex(
            (list) => Number(list.id) === Number(data.shoppingList?.id)
          );
          if (index >= 0) {
            const updated = [...prevLists];
            updated[index] = { ...updated[index], ...data.shoppingList };
            return updated;
          }
          // If not found, refresh the list
          loadShoppingLists(true);
          return prevLists;
        });
      })
    );

    // Shopping list deleted
    unsubscribers.push(
      shoppingListContext.onShoppingListDeleted((data) => {
        setShoppingLists((prevLists) =>
          prevLists.filter((list) => Number(list.id) !== Number(data.listId))
        );
      })
    );

    // Shopping item added
    unsubscribers.push(
      shoppingListContext.onShoppingItemAdded((data) => {
        setShoppingLists((prevLists) => {
          return prevLists.map((list) => {
            if (Number(list.id) === Number(data.listId)) {
              const updatedItems = [...(list.items || []), data.item];
              return { ...list, items: updatedItems };
            }
            return list;
          });
        });
      })
    );

    // Shopping item updated
    unsubscribers.push(
      shoppingListContext.onShoppingItemUpdated((data) => {
        setShoppingLists((prevLists) => {
          return prevLists.map((list) => {
            if (Number(list.id) === Number(data.listId)) {
              const updatedItems = (list.items || []).map((item: any) =>
                Number(item.id) === Number(data.item?.id) ? data.item : item
              );
              return { ...list, items: updatedItems };
            }
            return list;
          });
        });
      })
    );

    // Shopping item deleted
    unsubscribers.push(
      shoppingListContext.onShoppingItemDeleted((data) => {
        setShoppingLists((prevLists) => {
          return prevLists.map((list) => {
            if (Number(list.id) === Number(data.listId)) {
              const updatedItems = (list.items || []).filter(
                (item: any) => Number(item.id) !== Number(data.itemId)
              );
              return { ...list, items: updatedItems };
            }
            return list;
          });
        });
      })
    );

    // Shopping list shared
    unsubscribers.push(
      shoppingListContext.onShoppingListShared(() => {
        loadShoppingLists(true);
      })
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [shoppingListContext, loadShoppingLists]);

  // Load items when filtered lists change or date changes
  useEffect(() => {
    if (filteredShoppingLists.length > 0) {
      // Load items for all filtered lists that don't have items loaded yet
      // Check if items is undefined (not loaded) vs empty array (loaded but empty)
      filteredShoppingLists.forEach(list => {
        const itemsNotLoaded = list.items === undefined;
        const alreadyLoaded = loadedListIds.has(list.id);

        if (itemsNotLoaded && !alreadyLoaded) {
          setLoadedListIds(prev => new Set(prev).add(list.id));
          loadShoppingListItems(list.id);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredShoppingLists, selectedDateFull]);

  const loadShoppingListItems = async (listId: number, forceRefresh = false) => {
    try {
      // Use cached API for better performance
      let list: any;
      if (forceRefresh) {
        // Force refresh: always fetch from API
        const result = await refreshCachedAccess<any>(
          `shopping-lists/${listId}`,
          {},
          {
            ttl: CACHE_TTL.MEDIUM,
            cacheKey: `calendar:shopping-list:${listId}`,
            compareData: true,
          }
        );
        list = result.data;
      } else {
        // Normal fetch: use cache if available
        const result = await getCachedAccess<any>(
          `shopping-lists/${listId}`,
          {},
          {
            ttl: CACHE_TTL.MEDIUM,
            cacheKey: `calendar:shopping-list:${listId}`,
            compareData: true,
          }
        );
        list = result.data;
        
        // If we got data from cache, fetch fresh data in background
        if (result.fromCache) {
          refreshCachedAccess<any>(
            `shopping-lists/${listId}`,
            {},
            {
              ttl: CACHE_TTL.MEDIUM,
              cacheKey: `calendar:shopping-list:${listId}`,
              compareData: true,
            }
          ).then((freshResult) => {
            if (freshResult.updated && freshResult.data && freshResult.data.items) {
              // Update the list in shoppingLists with fresh items
              setShoppingLists(prevLists =>
                prevLists.map(l => {
                  if (l.id === listId) {
                    return { ...l, items: freshResult.data.items || [] };
                  }
                  return l;
                })
              );
            }
          }).catch(() => {
            // Silently fail background refresh
          });
        }
      }

      if (list) {
        // Update the list in shoppingLists with items (even if items is empty array)
        setShoppingLists(prevLists =>
          prevLists.map(l => {
            if (l.id === listId) {
              return { ...l, items: list.items || [] };
            }
            return l;
          })
        );
      }
    } catch (error: any) {
      // Remove from loaded set on error so it can be retried
      setLoadedListIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(listId);
        return newSet;
      });
      if (error.message === 'SESSION_EXPIRED' || error.response?.status === 401) {
        Alert.alert('Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại');
        router.push('/(auth)/login');
      } else {
        Alert.alert('Lỗi', 'Không thể tải danh sách mua sắm');
      }
    }
  };

  const handleDateSelect = (day: number, fullDate?: Date) => {
    setSelectedDate(day);
    if (fullDate) {
      setSelectedDateFull(fullDate);
    } else {
      // Fallback: reconstruct from day number
      const today = new Date();
      const newSelectedDate = new Date(today.getFullYear(), today.getMonth(), day);
      setSelectedDateFull(newSelectedDate);
    }
    // Reset loaded list IDs when date changes
    setLoadedListIds(new Set());
  };


  const handleToggleItem = async (itemId: number, listId: number) => {
    // Find the list containing this item
    const targetList = shoppingLists.find(l => l.id === listId);
    if (!targetList) return;

    // Store previous state for rollback
    let previousCheckedState: boolean | undefined = undefined;
    const itemToToggle = targetList.items?.find(item => item.id === itemId);
    if (itemToToggle) {
      previousCheckedState = itemToToggle.is_checked;
    }

    // Optimistic update: Toggle immediately
    setShoppingLists(prevLists =>
      prevLists.map(l =>
        l.id === listId
          ? {
            ...l,
            items: l.items?.map(item =>
              item.id === itemId ? { ...item, is_checked: !item.is_checked } : item
            ) || [],
          }
          : l
      )
    );

    try {
      // Call API
      await toggleItemChecked(itemId);

      // Clear cache for this specific list and main lists cache to force refresh
      await clearCacheByPattern(`calendar:shopping-list:${listId}`);
      await clearCacheByPattern('calendar:shopping-lists');

      // Reload only this list's items to sync with server (faster than reloading all)
      await loadShoppingListItems(listId, true); // Force refresh after cache clear
    } catch (error: any) {

      // Rollback optimistic update on error
      if (previousCheckedState !== undefined) {
        setShoppingLists(prevLists =>
          prevLists.map(l =>
            l.id === listId
              ? {
                ...l,
                items: l.items?.map(item =>
                  item.id === itemId ? { ...item, is_checked: previousCheckedState! } : item
                ) || [],
              }
              : l
          )
        );
      } else {
        // If we don't have previous state, reload the list
        await loadShoppingListItems(listId, true); // Force refresh
      }

      if (error.message === 'SESSION_EXPIRED' || error.response?.status === 401) {
        Alert.alert('Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại');
        router.push('/(auth)/login');
      } else {
        Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
      }
    }
  };


  const renderShoppingItem = (item: ShoppingItemType, listId: number) => {
    return (
      <TouchableOpacity
        key={item.id}
        style={groupStyles.shoppingItemRow}
        onPress={() => handleToggleItem(item.id, listId)}
      >
        <TouchableOpacity
          style={[
            groupStyles.checkbox,
            item.is_checked && groupStyles.checkboxChecked,
          ]}
          onPress={() => handleToggleItem(item.id, listId)}
        >
          {item.is_checked && (
            <Ionicons name="checkmark" size={16} color={COLORS.white} />
          )}
        </TouchableOpacity>

        {item.ingredient?.image_url ? (
          <Image
            source={{ uri: item.ingredient.image_url }}
            style={groupStyles.itemImage}
          />
        ) : (
          <View style={groupStyles.itemImage}>
            <Ionicons name="fast-food-outline" size={24} color={COLORS.grey} />
          </View>
        )}

        <View style={groupStyles.itemInfo}>
          <Text style={[
            groupStyles.itemName,
            item.is_checked && groupStyles.itemNameChecked,
          ]}>
            {item.ingredient?.name || 'Nguyên liệu'}
          </Text>
          <Text style={groupStyles.itemDetails}>
            Số lượng: {item.stock}g
          </Text>
        </View>

        <Text style={groupStyles.itemQuantity}>
          {item.price ? `${((item.price * item.stock) / 1000).toLocaleString()}đ` : ''}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={taskStyles.container}>
      {/* Content */}
      <ScrollView
        style={taskStyles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Header */}
        <View style={[styles.pageHeader, { paddingTop: insets.top + 20 }]}>
          <Text style={styles.pageTitle}>Nhiệm vụ của tôi</Text>
        </View>

        {/* Date Selector */}
        <DateSelector
          selectedDate={selectedDate}
          onSelectDate={handleDateSelect}
        />

        {/* Shopping Lists */}
        <View style={taskStyles.taskList}>
          {loading ? (
            <View style={taskStyles.emptyState}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={[taskStyles.emptyStateText, { marginTop: 16 }]}>
                Đang tải danh sách...
              </Text>
            </View>
          ) : filteredShoppingLists.length > 0 ? (
            filteredShoppingLists.map((list) => (
              <View key={list.id} style={[groupStyles.shoppingListCard, { marginBottom: 16 }]}>
                <View style={groupStyles.shoppingListHeader}>
                  <View>
                    {list.family ? (
                      <Text style={groupStyles.shoppingListTitle}>
                        {list.family.name}
                      </Text>
                    ) : (
                      <Text style={groupStyles.shoppingListTitle}>
                        Danh sách mua sắm
                      </Text>
                    )}
                  </View>
                  <Text style={groupStyles.shoppingListCost}>
                    {list.cost.toLocaleString()}đ
                  </Text>
                </View>

                {/* Items */}
                {list.items === undefined ? (
                  <View style={taskStyles.emptyState}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={[taskStyles.emptyStateText, { marginTop: 8 }]}>
                      Đang tải...
                    </Text>
                  </View>
                ) : list.items.length > 0 ? (
                  list.items.map(item => renderShoppingItem(item, list.id))
                ) : (
                  <View style={taskStyles.emptyState}>
                    <Text style={taskStyles.emptyStateText}>
                      Danh sách này trống
                    </Text>
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={taskStyles.emptyState}>
              <Text style={taskStyles.emptyStateText}>
                Không có danh sách mua sắm cho ngày này
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pageHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.darkGrey,
    textAlign: 'center',
  },
});

