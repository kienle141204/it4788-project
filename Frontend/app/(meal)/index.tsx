import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { mealStyles } from '../../styles/meal.styles';
import { COLORS } from '../../constants/themes';
import { getAccess, deleteAccess } from '../../utils/api';

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
  created_at: string;
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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

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
    async (pageNumber = 1, reset = false) => {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const payload = await getAccess(`menus?page=${pageNumber}&limit=${PAGE_LIMIT}`);

        if (!payload?.success) {
          throw new Error(payload?.message || 'Không thể tải danh sách thực đơn');
        }

        const newMenus: Menu[] = payload.data || [];
        const pagination = payload.pagination || {};

        setMenus(prev => (reset ? newMenus : [...prev, ...newMenus]));
        setHasNextPage(Boolean(pagination.hasNextPage));
        setPage(pagination.currentPage || pageNumber);
        setError(null);
      } catch (err: any) {
        if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
          handleSessionExpired();
          return;
        }
        console.error('fetchMenus error', err);
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
      // Chỉ refresh nếu đã có dữ liệu (tránh double loading lần đầu)
      if (menus.length > 0) {
        fetchMenus(1, true);
      }
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
    fetchMenus(1, true);
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
          onPress: async () => {
            try {
              const payload = await deleteAccess(`menus/${selectedMenu.id}`);
    
              if (payload?.success !== false) {
                Alert.alert('Thành công', 'Đã xóa thực đơn thành công');
                setShowMenuOptionsModal(false);
                setSelectedMenu(null);
                // Refresh danh sách
                fetchMenus(1, true);
              } else {
                throw new Error(payload?.message || 'Không thể xóa thực đơn');
              }
            } catch (err: any) {
              if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
                handleSessionExpired();
                return;
              }
              console.error('handleDeleteMenu error', err);
              Alert.alert('Lỗi', err?.message || 'Không thể xóa thực đơn. Vui lòng thử lại.');
            }
          },
        },
      ],
    );
  };

  const handleOpenDatePicker = () => {
    // Set tempDate về ngày đã chọn hoặc hôm nay
    setTempDate(selectedDate || new Date());
    setShowDatePicker(true);
  };

  const handleDateConfirm = (date: Date) => {
    setSelectedDate(date);
    setShowDatePicker(false);
  };

  const handleDateCancel = () => {
    setShowDatePicker(false);
  };

  const adjustDate = (field: 'day' | 'month' | 'year', delta: number) => {
    const newDate = new Date(tempDate);
    if (field === 'day') {
      newDate.setDate(newDate.getDate() + delta);
    } else if (field === 'month') {
      newDate.setMonth(newDate.getMonth() + delta);
    } else if (field === 'year') {
      newDate.setFullYear(newDate.getFullYear() + delta);
    }
    setTempDate(newDate);
  };

  const handleClearFilter = () => {
    setSelectedDate(null);
  };

  const formatFilterDate = (date: Date | null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderMenuCard = (menu: Menu) => {
    const isExpanded = expandedMenuId === menu.id;

    return (
      <View key={menu.id} style={mealStyles.menuCard}>
        <TouchableOpacity
          onPress={() => handleMenuPress(menu.id)}
          onLongPress={() => handleMenuLongPress(menu)}
          activeOpacity={0.7}
        >
          <View style={mealStyles.menuHeader}>
            <View style={mealStyles.menuInfo}>
              {/* <Text style={mealStyles.sectionLabel}>Gia đình</Text> */}
              <Text style={mealStyles.menuTitle}>{menu.family?.name || 'Không xác định'}</Text>
              {/* {!!menu.description && <Text style={mealStyles.menuMeta}>{menu.description}</Text>} */}
            </View>
            <View style={mealStyles.menuDate}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.grey} />
              <Text style={mealStyles.menuDateText}>{formatDate(menu.created_at)}</Text>
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={COLORS.grey}
                style={{ marginLeft: 8 }}
              />
            </View>
          </View>
        </TouchableOpacity>

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
    <View style={mealStyles.container}>
      <StatusBar barStyle='dark-content' backgroundColor='#FFFFFF' />

      <View style={mealStyles.header}>
        <TouchableOpacity onPress={handleBack} style={mealStyles.backButton}>
          <Ionicons name='arrow-back' size={24} color={COLORS.darkGrey} />
        </TouchableOpacity>

        <Text style={mealStyles.headerTitle}>Thực đơn gia đình</Text>

        <TouchableOpacity onPress={handleAddMenuPress} style={mealStyles.notificationButton}>
          <Ionicons name='add' size={24} color={COLORS.darkGrey} />
        </TouchableOpacity>
      </View>

      {/* Filter bar */}
      <View style={mealStyles.filterBar}>
        <TouchableOpacity
          style={mealStyles.filterButton}
          onPress={handleOpenDatePicker}
          activeOpacity={0.7}
        >
          <Ionicons name='calendar-outline' size={20} color={COLORS.purple} />
          <Text style={mealStyles.filterButtonText}>
            {selectedDate ? formatFilterDate(selectedDate) : 'Lọc theo ngày'}
          </Text>
          {selectedDate && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleClearFilter();
              }}
              style={mealStyles.clearFilterButton}
            >
              <Ionicons name='close-circle' size={18} color={COLORS.grey} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>

      {loading && menus.length === 0 ? (
        <View style={mealStyles.loaderContainer}>
          <ActivityIndicator size='large' color={COLORS.purple} />
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

          {!error && menus.length === 0 && (
            <View style={mealStyles.emptyState}>
              <Ionicons name='restaurant-outline' size={32} color={COLORS.grey} />
              <Text style={mealStyles.emptyStateText}>Chưa có thực đơn nào được chia sẻ.</Text>
            </View>
          )}

          {menus.map(renderMenuCard)}

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

      {/* Date Picker Modal */}
      <Modal visible={showDatePicker} transparent animationType="slide">
        <TouchableOpacity
          style={mealStyles.datePickerModalOverlay}
          activeOpacity={1}
          onPress={handleDateCancel}
        >
          <View
            style={mealStyles.datePickerModalContent}
            onStartShouldSetResponder={() => true}
          >
            <View style={mealStyles.datePickerHeader}>
              <Text style={mealStyles.datePickerTitle}>Chọn ngày</Text>
              <TouchableOpacity
                onPress={handleDateCancel}
                style={mealStyles.datePickerCloseButton}
              >
                <Ionicons name="close" size={24} color={COLORS.darkGrey} />
              </TouchableOpacity>
            </View>
            
            {/* Custom Date Picker */}
            <View style={{ padding: 20, alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
                {/* Day */}
                <View style={{ alignItems: 'center', minWidth: 80 }}>
                  <Text style={{ fontSize: 14, color: COLORS.grey, marginBottom: 8 }}>Ngày</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <TouchableOpacity
                      onPress={() => adjustDate('day', -1)}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: COLORS.lightGrey,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons name="remove" size={20} color={COLORS.darkGrey} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 24, fontWeight: '600', color: COLORS.darkGrey, minWidth: 40, textAlign: 'center' }}>
                      {tempDate.getDate()}
                    </Text>
                    <TouchableOpacity
                      onPress={() => adjustDate('day', 1)}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: COLORS.lightGrey,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons name="add" size={20} color={COLORS.darkGrey} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Month */}
                <View style={{ alignItems: 'center', minWidth: 80 }}>
                  <Text style={{ fontSize: 14, color: COLORS.grey, marginBottom: 8 }}>Tháng</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <TouchableOpacity
                      onPress={() => adjustDate('month', -1)}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: COLORS.lightGrey,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons name="remove" size={20} color={COLORS.darkGrey} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 24, fontWeight: '600', color: COLORS.darkGrey, minWidth: 40, textAlign: 'center' }}>
                      {tempDate.getMonth() + 1}
                    </Text>
                    <TouchableOpacity
                      onPress={() => adjustDate('month', 1)}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: COLORS.lightGrey,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons name="add" size={20} color={COLORS.darkGrey} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Year */}
                <View style={{ alignItems: 'center', minWidth: 100 }}>
                  <Text style={{ fontSize: 14, color: COLORS.grey, marginBottom: 8 }}>Năm</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <TouchableOpacity
                      onPress={() => adjustDate('year', -1)}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: COLORS.lightGrey,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons name="remove" size={20} color={COLORS.darkGrey} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 24, fontWeight: '600', color: COLORS.darkGrey, minWidth: 60, textAlign: 'center' }}>
                      {tempDate.getFullYear()}
                    </Text>
                    <TouchableOpacity
                      onPress={() => adjustDate('year', 1)}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: COLORS.lightGrey,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons name="add" size={20} color={COLORS.darkGrey} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              
              <View style={{ marginTop: 20, padding: 16, backgroundColor: COLORS.lightGrey, borderRadius: 12 }}>
                <Text style={{ fontSize: 16, color: COLORS.grey, textAlign: 'center', marginBottom: 4 }}>
                  Ngày đã chọn
                </Text>
                <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.darkGrey, textAlign: 'center' }}>
                  {formatFilterDate(tempDate)}
                </Text>
              </View>
            </View>

            <View style={mealStyles.datePickerActions}>
              <TouchableOpacity
                style={[mealStyles.datePickerActionButton, mealStyles.datePickerCancelButton]}
                onPress={handleDateCancel}
              >
                <Text style={mealStyles.datePickerCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[mealStyles.datePickerActionButton, mealStyles.datePickerConfirmButton]}
                onPress={() => handleDateConfirm(tempDate)}
              >
                <Text style={mealStyles.datePickerConfirmText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

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
              <Ionicons name="create-outline" size={24} color={COLORS.purple} />
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
    </View>
  );
}


