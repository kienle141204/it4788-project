import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { mealStyles } from '../../styles/meal.styles';
import { COLORS } from '../../constants/themes';
import { getAccess, deleteAccess } from '../../utils/api';
import { getCachedAccess, refreshCachedAccess, CACHE_TTL } from '../../utils/cachedApi';
import { clearCacheByPattern, getCache } from '../../utils/cache';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Family {
  id: string;
  name: string;
}

interface Dish {
  id: string;
  name: string;
  image_url: string | null;
  description?: string;
}

interface MenuDish {
  id: string;
  stock: number;
  price: string;
  dish: Dish | null;
}

interface Menu {
  id: string;
  family: Family | null;
  description: string | null;
  created_at: string; // Coi created_at như date của menu
  time?: string; // 'breakfast' | 'lunch' | 'dinner' | 'snack'
  menuDishes: MenuDish[];
}

const PAGE_LIMIT = 10;

const formatDate = (value?: string) => {
  if (!value) {
    return 'Không xác định';
  }
  try {
    return new Date(value).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return value;
  }
};

const formatTime = (time?: string) => {
  const timeMap: { [key: string]: string } = {
    breakfast: 'Bữa sáng',
    lunch: 'Bữa trưa',
    dinner: 'Bữa tối',
    snack: 'Bữa phụ',
  };
  return time ? timeMap[time] || time : 'Không xác định';
};

const formatPrice = (value?: string | number) => {
  if (value === undefined || value === null) {
    return '—';
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return '—';
  }
  return `${parsed.toLocaleString('vi-VN')} ₫`;
};

export default function MealPage() {
  const router = useRouter();
  const sessionExpiredRef = useRef(false);
  const deletedMenuIdsRef = useRef<Set<string>>(new Set()); // Track optimistically deleted menu IDs
  const [menus, setMenus] = useState<Menu[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedMenuId, setExpandedMenuId] = useState<string | null>(null);
  const [showMenuOptionsModal, setShowMenuOptionsModal] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateOffset, setDateOffset] = useState<number>(0);

  const handleSessionExpired = useCallback(() => {
    if (sessionExpiredRef.current) {
      return;
    }
    sessionExpiredRef.current = true;
    Alert.alert('Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại.', [
      {
        text: 'OK',
        onPress: () => router.replace('/(auth)' as any),
      },
    ]);
  }, [router]);

  const fetchMenus = useCallback(
    async (pageNumber = 1, reset = false, isRefreshing = false) => {
      const cacheKey = `meal:menus:page:${pageNumber}`;
      
      if (reset && !isRefreshing) {
        // Check cache first for initial load
        const cachedData = await getCache<any>(cacheKey);
        
        if (cachedData && cachedData.success) {
          // We have cache, show it immediately without loading
          const newMenus: Menu[] = cachedData.data || [];
          const pagination = cachedData.pagination || {};
          
          setMenus(newMenus);
          setHasNextPage(Boolean(pagination.hasNextPage));
          setPage(pagination.currentPage || pageNumber);
          setError(null);
          setLoading(false);
          
          // Fetch fresh data in background
          refreshCachedAccess<any>(
            `menus?page=${pageNumber}&limit=${PAGE_LIMIT}`,
            {},
            {
              ttl: CACHE_TTL.MEDIUM,
              cacheKey,
              compareData: true,
            }
          ).then((freshResult) => {
            if (freshResult.updated && freshResult.data?.success) {
              const freshMenus: Menu[] = freshResult.data.data || [];
              const freshPagination = freshResult.data.pagination || {};
              // Filter out optimistically deleted menus
              const filteredMenus = freshMenus.filter(m => !deletedMenuIdsRef.current.has(String(m.id)));
              setMenus(filteredMenus);
              setHasNextPage(Boolean(freshPagination.hasNextPage));
              setPage(freshPagination.currentPage || pageNumber);
            }
          }).catch(() => {
            // Silently fail background refresh
          });
          
          return;
        }
        
        setLoading(true);
      } else if (reset && isRefreshing) {
        setRefreshing(true);
      } else {
        setLoadingMore(true);
      }

      try {
        let payload: any;
        
        if (isRefreshing) {
          // Force refresh: always fetch from API
          const result = await refreshCachedAccess<any>(
            `menus?page=${pageNumber}&limit=${PAGE_LIMIT}`,
            {},
            {
              ttl: CACHE_TTL.MEDIUM,
              cacheKey,
              compareData: true,
            }
          );
          payload = result.data;
        } else {
          // Normal fetch: use cache if available
          const result = await getCachedAccess<any>(
            `menus?page=${pageNumber}&limit=${PAGE_LIMIT}`,
            {},
            {
              ttl: CACHE_TTL.MEDIUM,
              cacheKey,
              compareData: true,
            }
          );
          payload = result.data;
          
          // If we got data from cache, fetch fresh data in background
          if (result.fromCache && reset) {
            refreshCachedAccess<any>(
              `menus?page=${pageNumber}&limit=${PAGE_LIMIT}`,
              {},
              {
                ttl: CACHE_TTL.MEDIUM,
                cacheKey,
                compareData: true,
              }
            ).then((freshResult) => {
              if (freshResult.updated && freshResult.data?.success) {
                const freshMenus: Menu[] = freshResult.data.data || [];
                const freshPagination = freshResult.data.pagination || {};
                setMenus(freshMenus);
                setHasNextPage(Boolean(freshPagination.hasNextPage));
                setPage(freshPagination.currentPage || pageNumber);
              }
            }).catch(() => {
              // Silently fail background refresh
            });
          }
        }

        if (!payload?.success) {
          throw new Error(payload?.message || 'Không thể tải danh sách thực đơn');
        }

        const newMenus: Menu[] = payload.data || [];
        const pagination = payload.pagination || {};

        // When resetting, replace all menus. When appending, add new ones.
        // Filter out any menus that were optimistically deleted
        setMenus(prev => {
          if (reset) {
            // Filter out optimistically deleted menus
            return newMenus.filter(m => !deletedMenuIdsRef.current.has(String(m.id)));
          } else {
            // Only add menus that don't already exist and weren't deleted
            const existingIds = new Set(prev.map(m => String(m.id)));
            const uniqueNewMenus = newMenus.filter(
              m => !existingIds.has(String(m.id)) && !deletedMenuIdsRef.current.has(String(m.id))
            );
            return [...prev, ...uniqueNewMenus];
          }
        });
        setHasNextPage(Boolean(pagination.hasNextPage));
        setPage(pagination.currentPage || pageNumber);
        setError(null);
      } catch (err: any) {
        if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
          handleSessionExpired();
          return;
        }
        setError('Không thể tải danh sách thực đơn. Vui lòng thử lại.');
        if (reset) {
          setMenus([]);
        }
      } finally {
        if (reset) {
          setLoading(false);
          setRefreshing(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    [handleSessionExpired],
  );

  useEffect(() => {
    fetchMenus(1, true);
  }, [fetchMenus]);

  // Refresh danh sách khi màn hình được focus lại (ví dụ: quay lại từ màn hình edit)
  useFocusEffect(
    useCallback(() => {
      // Check for optimistic menu from create page
      AsyncStorage.getItem('optimistic_menu_new')
        .then(async (optimisticMenuStr) => {
          if (optimisticMenuStr) {
            try {
              const optimisticMenu: Menu = JSON.parse(optimisticMenuStr);
              
              // Add optimistic menu to state immediately (optimistic UI)
              setMenus(prevMenus => {
                // Check if menu already exists (avoid duplicates)
                const exists = prevMenus.some(m => String(m.id) === String(optimisticMenu.id));
                if (!exists) {
                  // Add to beginning of list
                  return [optimisticMenu, ...prevMenus];
                }
                return prevMenus;
              });
              
              // Remove from AsyncStorage after adding to state
              await AsyncStorage.removeItem('optimistic_menu_new');
              
              // Refresh in background to get real data from server
              fetchMenus(1, true, false).catch(() => {
                // Silently fail, optimistic update is already shown
              });
            } catch (error) {
              console.warn('Error parsing optimistic menu:', error);
              await AsyncStorage.removeItem('optimistic_menu_new');
            }
          } else {
            // No optimistic menu, just refresh normally
            if (menus.length > 0 && deletedMenuIdsRef.current.size === 0) {
              // Refresh immediately without showing loading state for better UX (optimistic refresh)
              // Use isRefreshing=false to avoid showing spinner
              fetchMenus(1, true, false).catch(() => {
                // Silently fail, optimistic update is already shown
              });
            } else if (menus.length === 0) {
              // If no menus, fetch normally (first load)
              fetchMenus(1, true, false).catch(() => {});
            }
          }
        })
        .catch(() => {
          // If error reading AsyncStorage, just refresh normally
          if (menus.length > 0 && deletedMenuIdsRef.current.size === 0) {
            fetchMenus(1, true, false).catch(() => {});
          } else if (menus.length === 0) {
            fetchMenus(1, true, false).catch(() => {});
          }
        });
    }, [fetchMenus, menus.length]),
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home' as any);
    }
  };

  const handleAddMenuPress = () => {
    router.push('/(meal)/create-menu' as any);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMenus(1, true, true); // Pass isRefreshing flag
  };

  const handleLoadMore = () => {
    if (loadingMore || !hasNextPage) {
      return;
    }
    fetchMenus(page + 1, false);
  };

  const handleMenuPress = (menuId: string) => {
    setExpandedMenuId(prev => (prev === menuId ? null : menuId));
  };

  const handleDishPress = (dishId: string) => {
    router.push(`/(food)/${dishId}` as any);
  };

  const handleMenuLongPress = (menu: Menu) => {
    setSelectedMenu(menu);
    setShowMenuOptionsModal(true);
  };

  const handleEditMenu = () => {
    if (selectedMenu) {
      setShowMenuOptionsModal(false);
      router.push(`/(meal)/edit-menu?id=${selectedMenu.id}` as any);
    }
  };

  const handleDeleteMenu = () => {
    if (!selectedMenu) return;

    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa thực đơn này?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
          onPress: () => setShowMenuOptionsModal(false),
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            // Đảm bảo ID là số
            const menuId = typeof selectedMenu.id === 'string' ? parseInt(selectedMenu.id, 10) : selectedMenu.id;

            if (isNaN(menuId)) {
              setShowMenuOptionsModal(false);
              Alert.alert('Lỗi', 'ID thực đơn không hợp lệ');
              return;
            }

            // Store deleted menu for rollback
            const deletedMenu = { ...selectedMenu };
            const menuIdToDelete = String(selectedMenu.id);

            // Track deleted menu ID to prevent it from reappearing
            deletedMenuIdsRef.current.add(menuIdToDelete);

            // CRITICAL: Update state IMMEDIATELY before closing modal
            // This ensures the menu disappears instantly
            // Use String comparison to handle both string and number IDs
            setMenus(prevMenus => 
              prevMenus.filter(menu => String(menu.id) !== menuIdToDelete)
            );
            
            // Close modal after state update
            setShowMenuOptionsModal(false);
            setSelectedMenu(null);

            // Call API in background (don't await to keep UI responsive)
            deleteAccess(`menus/${menuId}`)
              .then((payload) => {
                // Kiểm tra response - backend trả về { success: true, message: '...' }
                if (payload?.success === true) {
                  // Invalidate cache when deleting menu
                  clearCacheByPattern('meal:menus').catch(() => {});
                  
                  // Clear deleted menu ID from tracking after successful deletion
                  // Wait a bit to ensure server has processed the deletion
                  setTimeout(() => {
                    deletedMenuIdsRef.current.delete(menuIdToDelete);
                  }, 3000);
                  
                  // Don't fetch menus again - optimistic update is already shown
                  // Menu is already removed from state, no need to refresh
                  // This prevents the menu from reappearing and avoids showing spinner
                } else {
                  throw new Error(payload?.message || payload?.error || 'Không thể xóa thực đơn');
                }
              })
              .catch((err: any) => {
                // Rollback optimistic update on error
                const deletedMenuId = String(deletedMenu.id);
                deletedMenuIdsRef.current.delete(deletedMenuId); // Remove from deleted set
                
                setMenus(prevMenus => {
                  // Check if menu is not already in the list (avoid duplicates)
                  const exists = prevMenus.some(m => String(m.id) === deletedMenuId);
                  if (!exists) {
                    // Insert back at the beginning to maintain order
                    return [deletedMenu, ...prevMenus];
                  }
                  return prevMenus;
                });

                if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
                  handleSessionExpired();
                  return;
                }

                let errorMessage = 'Không thể xóa thực đơn. Vui lòng thử lại.';

                if (err?.response?.status === 500) {
                  errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
                } else if (err?.response?.status === 403) {
                  errorMessage = 'Bạn không có quyền xóa thực đơn này.';
                } else if (err?.response?.status === 404) {
                  errorMessage = 'Không tìm thấy thực đơn.';
                } else if (err?.response?.data?.message) {
                  errorMessage = err.response.data.message;
                } else if (err?.message) {
                  errorMessage = err.message;
                }

                Alert.alert('Lỗi', errorMessage);
              });
          },
        },
      ],
    );
  };

  // Generate date range for carousel (5 dates: 2 before, current, 2 after based on offset)
  const dateRange = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = -2; i <= 2; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + dateOffset + i);
      dates.push(date);
    }
    return dates;
  }, [dateOffset]);

  // Format date for carousel display
  const formatDateForCarousel = (date: Date) => {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const today = new Date();
    const isToday = isSameDay(date, today);

    return {
      day: date.getDate(),
      weekday: days[date.getDay()],
      isToday,
    };
  };

  // Check if two dates are the same day
  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const handlePreviousDate = () => {
    setDateOffset(prev => prev - 1);
  };

  const handleNextDate = () => {
    setDateOffset(prev => prev + 1);
  };

  // Filter menus by selected date (coi created_at như date)
  const filteredMenus = useMemo(() => {
    if (!menus || menus.length === 0) {
      return [];
    }
    
    return menus.filter(menu => {
      try {
        // Sử dụng created_at như date của menu
        if (!menu.created_at) {
          return false;
        }
        
        const menuDate = new Date(menu.created_at);
        
        // Check if date is valid
        if (isNaN(menuDate.getTime())) {
          return false;
        }
        
        return isSameDay(menuDate, selectedDate);
      } catch (error) {
        // If there's an error parsing the date, skip this menu
        console.warn('Error parsing menu date:', error, menu);
        return false;
      }
    });
  }, [menus, selectedDate]);

  const renderDateCarousel = () => {
    return (
      <View style={mealStyles.dateCarouselContainer}>
        <TouchableOpacity
          style={mealStyles.dateNavButton}
          onPress={handlePreviousDate}
        >
          <Ionicons name="chevron-back" size={20} color={COLORS.darkGrey} />
        </TouchableOpacity>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={mealStyles.dateCarousel}
        >
          {dateRange.map((date, index) => {
            const { day, weekday, isToday } = formatDateForCarousel(date);
            const isActive = isSameDay(date, selectedDate);

            return (
              <TouchableOpacity
                key={index}
                style={[
                  mealStyles.dateItem,
                  isActive && mealStyles.dateItemActive,
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[
                  mealStyles.dateWeekday,
                  isActive && mealStyles.dateWeekdayActive,
                ]}>
                  {isToday ? 'Hôm nay' : weekday}
                </Text>
                <Text style={[
                  mealStyles.dateDay,
                  isActive && mealStyles.dateDayActive,
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          style={mealStyles.dateNavButton}
          onPress={handleNextDate}
        >
          <Ionicons name="chevron-forward" size={20} color={COLORS.darkGrey} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderMenuCard = (menu: Menu) => {
    const isExpanded = expandedMenuId === menu.id;

    return (
      <View key={menu.id} style={mealStyles.menuCard}>
        <View style={mealStyles.menuHeader}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => handleMenuPress(menu.id)}
            activeOpacity={0.7}
          >
            <View style={mealStyles.menuInfo}>
              {/* <Text style={mealStyles.sectionLabel}>Gia đình</Text> */}
              <Text style={mealStyles.menuTitle}>{menu.family?.name || 'Không xác định'}</Text>
            </View>
            <View style={mealStyles.menuDate}>
              <Ionicons name="time-outline" size={18} color={COLORS.grey} />
              <Text style={mealStyles.menuDateText}>
                {menu.time ? formatTime(menu.time) : 'Không xác định'}
              </Text>
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={COLORS.grey}
                style={{ marginLeft: 8 }}
              />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ padding: 8 }}
            onPress={() => handleMenuLongPress(menu)}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={COLORS.darkGrey} />
          </TouchableOpacity>
        </View>

        {!menu.description && (
          <Text style={mealStyles.menuDescription}>Chưa có mô tả cho thực đơn này.</Text>
        )}

        {isExpanded && (
          <>
            {!!menu.description && <Text style={mealStyles.menuMeta}>{menu.description}</Text>}
            {menu.menuDishes?.length ? (
              <View style={mealStyles.dishList}>
                {menu.menuDishes.map(dishItem => (
                  <TouchableOpacity
                    key={dishItem.id}
                    style={mealStyles.dishCard}
                    onPress={() => dishItem.dish?.id && handleDishPress(dishItem.dish.id)}
                    activeOpacity={0.7}
                  >
                    {dishItem.dish?.image_url ? (
                      <Image
                        source={{ uri: dishItem.dish.image_url }}
                        style={mealStyles.dishImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={[
                          mealStyles.dishImage,
                          { justifyContent: 'center', alignItems: 'center' },
                        ]}
                      >
                        <Ionicons name='restaurant-outline' size={22} color={COLORS.grey} />
                      </View>
                    )}

                    <View style={mealStyles.dishContent}>
                      <Text style={mealStyles.dishName}>{dishItem.dish?.name || 'Món ăn'}</Text>
                      {/* <Text style={mealStyles.dishMeta}>
                        SL: {dishItem.stock ?? 0} • Giá: {formatPrice(dishItem.price)}
                      </Text> */}
                      {/* {dishItem.dish?.description && (
                        <Text numberOfLines={2} style={mealStyles.dishMeta}>
                          {dishItem.dish.description}
                        </Text>
                      )} */}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={mealStyles.emptyState}>
                <Text style={mealStyles.emptyStateText}>Chưa có món ăn nào trong thực đơn này.</Text>
              </View>
            )}
          </>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar barStyle='dark-content' backgroundColor={COLORS.background} translucent={false} />
      <SafeAreaView style={[mealStyles.container, { backgroundColor: COLORS.background }]} edges={['top']}>
        <View style={[mealStyles.header, { backgroundColor: COLORS.background }]}>
        <TouchableOpacity onPress={handleBack} style={mealStyles.backButton}>
          <Ionicons name='arrow-back' size={24} color={COLORS.darkGrey} />
        </TouchableOpacity>

        <Text style={mealStyles.headerTitle}>Thực đơn gia đình</Text>

        <TouchableOpacity onPress={handleAddMenuPress} style={mealStyles.notificationButton}>
          <Ionicons name='add' size={24} color={COLORS.darkGrey} />
        </TouchableOpacity>
      </View>

      {/* Date Carousel */}
      {renderDateCarousel()}



      {loading && menus.length === 0 ? (
        <View style={mealStyles.loaderContainer}>
          <ActivityIndicator size='large' color={COLORS.primary} />
          <Text style={mealStyles.loaderText}>Đang tải thực đơn...</Text>
        </View>
      ) : (
        <ScrollView
          style={mealStyles.scrollView}
          contentContainerStyle={mealStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.purple}
            />
          }
        >
          {error && (
            <View style={mealStyles.errorContainer}>
              <Ionicons name='alert-circle' size={20} color={COLORS.orange} />
              <Text style={mealStyles.errorText}>{error}</Text>
            </View>
          )}

          {!error && filteredMenus.length === 0 && menus.length > 0 && (
            <View style={mealStyles.emptyState}>
              <Ionicons name='restaurant-outline' size={32} color={COLORS.grey} />
              <Text style={mealStyles.emptyStateText}>
                Không có thực đơn nào cho ngày đã chọn.
              </Text>
            </View>
          )}

          {!error && menus.length === 0 && !loading && (
            <View style={mealStyles.emptyState}>
              <Ionicons name='restaurant-outline' size={32} color={COLORS.grey} />
              <Text style={mealStyles.emptyStateText}>
                Chưa có thực đơn nào. Nhấn nút + để tạo thực đơn mới.
              </Text>
            </View>
          )}

          {filteredMenus.map(renderMenuCard)}

          {hasNextPage && (
            <TouchableOpacity
              style={mealStyles.loadMoreButton}
              onPress={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <ActivityIndicator size='small' color={COLORS.white} />
              ) : (
                <Text style={mealStyles.loadMoreButtonText}>Tải thêm</Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      )}


      {/* Modal options cho menu */}
      <Modal visible={showMenuOptionsModal} transparent animationType="fade">
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={1}
          onPress={() => setShowMenuOptionsModal(false)}
        >
          <View
            style={{
              backgroundColor: COLORS.white,
              borderRadius: 16,
              padding: 20,
              width: '80%',
              maxWidth: 300,
            }}
            onStartShouldSetResponder={() => true}
          >
            <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.darkGrey, marginBottom: 20 }}>
              Tùy chọn
            </Text>

            <TouchableOpacity
              onPress={handleEditMenu}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#F0F0F0',
              }}
            >
              <Ionicons name="create-outline" size={24} color={COLORS.primary} />
              <Text style={{ fontSize: 16, color: COLORS.darkGrey, marginLeft: 12 }}>Sửa thực đơn</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDeleteMenu}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                marginTop: 8,
              }}
            >
              <Ionicons name="trash-outline" size={24} color={COLORS.orange} />
              <Text style={{ fontSize: 16, color: COLORS.orange, marginLeft: 12 }}>Xóa thực đơn</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowMenuOptionsModal(false)}
              style={{
                marginTop: 16,
                paddingVertical: 12,
                alignItems: 'center',
                borderTopWidth: 1,
                borderTopColor: '#F0F0F0',
              }}
            >
              <Text style={{ fontSize: 16, color: COLORS.grey }}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      </SafeAreaView>
    </View>
  );
}


