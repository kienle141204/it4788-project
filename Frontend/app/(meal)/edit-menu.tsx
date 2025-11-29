import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS } from '../../constants/themes';
import { mealStyles } from '../../styles/meal.styles';
import { getAccess, postAccess, patchAccess, deleteAccess } from '../../utils/api';

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
  price: string | number;
  dish: Dish | null;
}

interface SelectedDish {
  menuDishId?: string; // ID của menuDish nếu đã tồn tại
  dish: Dish;
  stock: number;
  price: number;
}

const PAGE_LIMIT = 20;

export default function EditMenuPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessionExpiredRef = useRef(false);
  const [menuId] = useState<string | null>(id || null);
  const [family, setFamily] = useState<Family | null>(null);
  const [description, setDescription] = useState('');
  const [selectedDishes, setSelectedDishes] = useState<SelectedDish[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [loadingDishes, setLoadingDishes] = useState(false);
  const [showDishModal, setShowDishModal] = useState(false);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [dishPage, setDishPage] = useState(1);
  const [hasNextDishPage, setHasNextDishPage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const fetchMenu = useCallback(async () => {
    if (!menuId) return;
    setLoadingMenu(true);
    try {
      const payload = await getAccess(`menus/${menuId}`);

      if (!payload?.success) {
        throw new Error(payload?.message || 'Không thể tải thông tin thực đơn');
      }

      const menu = payload.data;
      if (menu) {
        setFamily(menu.family || null);
        setDescription(menu.description || '');
        
        // Chuyển đổi menuDishes thành SelectedDish
        const menuDishes: SelectedDish[] = (menu.menuDishes || []).map((md: MenuDish) => ({
          menuDishId: md.id,
          dish: md.dish || { id: '', name: 'Món ăn', image_url: null },
          stock: md.stock || 0,
          price: typeof md.price === 'string' ? parseFloat(md.price) : md.price || 0,
        }));
        setSelectedDishes(menuDishes);
      }
    } catch (err: any) {
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        handleSessionExpired();
        return;
      }
      console.error('fetchMenu error', err);
      Alert.alert('Lỗi', err?.message || 'Không thể tải thông tin thực đơn');
      router.back();
    } finally {
      setLoadingMenu(false);
    }
  }, [menuId, handleSessionExpired]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const fetchDishes = useCallback(
    async (pageNumber = 1, reset = false) => {
      setLoadingDishes(true);
      try {
        const endpoint = searchQuery.trim()
          ? `dishes/search-paginated?name=${encodeURIComponent(searchQuery)}&page=${pageNumber}&limit=${PAGE_LIMIT}`
          : `dishes/get-paginated?page=${pageNumber}&limit=${PAGE_LIMIT}`;

        const payload = await getAccess(endpoint);

        if (!payload?.success) {
          throw new Error(payload?.message || 'Không thể tải danh sách món ăn');
        }

        const newDishes: Dish[] = payload.data || [];
        const pagination = payload.pagination || {};

        setDishes(prev => (reset ? newDishes : [...prev, ...newDishes]));
        setHasNextDishPage(Boolean(pagination.hasNextPage));
        setDishPage(pagination.currentPage || pageNumber);
      } catch (err: any) {
        if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
          handleSessionExpired();
          return;
        }
        console.error('fetchDishes error', err);
      } finally {
        setLoadingDishes(false);
      }
    },
    [searchQuery, handleSessionExpired],
  );

  useEffect(() => {
    if (showDishModal) {
      fetchDishes(1, true);
    }
  }, [showDishModal, fetchDishes]);

  const handleBack = () => {
    router.back();
  };

  const handleAddDish = (dish: Dish) => {
    const existingIndex = selectedDishes.findIndex(sd => sd.dish.id === dish.id);
    if (existingIndex >= 0) {
      Alert.alert('Thông báo', 'Món ăn này đã được thêm vào thực đơn');
      return;
    }
    setSelectedDishes(prev => [...prev, { dish, stock: 1, price: 0 }]);
    setShowDishModal(false);
  };

  const handleRemoveDish = async (selectedDish: SelectedDish) => {
    // Nếu có menuDishId, cần xóa từ server
    if (selectedDish.menuDishId) {
      try {
        const payload = await deleteAccess(`menus/dishes/${selectedDish.menuDishId}`);
        if (payload?.success !== false) {
          setSelectedDishes(prev => prev.filter(sd => sd.dish.id !== selectedDish.dish.id));
        } else {
          throw new Error(payload?.message || 'Không thể xóa món ăn');
        }
      } catch (err: any) {
        if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
          handleSessionExpired();
          return;
        }
        console.error('handleRemoveDish error', err);
        Alert.alert('Lỗi', err?.message || 'Không thể xóa món ăn. Vui lòng thử lại.');
      }
    } else {
      // Chỉ xóa khỏi state nếu chưa lưu
      setSelectedDishes(prev => prev.filter(sd => sd.dish.id !== selectedDish.dish.id));
    }
  };

  const handleUpdateDish = async (selectedDish: SelectedDish, field: 'stock' | 'price', value: number) => {
    // Cập nhật state
    setSelectedDishes(prev =>
      prev.map(sd =>
        sd.dish.id === selectedDish.dish.id ? { ...sd, [field]: value } : sd,
      ),
    );

    // Nếu có menuDishId, cập nhật trên server
    if (selectedDish.menuDishId) {
      try {
        await patchAccess(`menus/dishes/${selectedDish.menuDishId}`, {
          [field]: value,
        });
      } catch (err: any) {
        if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
          handleSessionExpired();
          return;
        }
        console.error('handleUpdateDish error', err);
        // Revert state nếu lỗi
        setSelectedDishes(prev =>
          prev.map(sd =>
            sd.dish.id === selectedDish.dish.id
              ? { ...sd, [field]: selectedDish[field] }
              : sd,
          ),
        );
      }
    }
  };

  const handleSaveMenu = async () => {
    if (!menuId) {
      Alert.alert('Lỗi', 'Không tìm thấy ID thực đơn');
      return;
    }

    if (selectedDishes.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng thêm ít nhất một món ăn');
      return;
    }

    setLoading(true);
    try {
      // Lấy danh sách món ăn hiện có và món ăn mới
      const newDishes = selectedDishes.filter(sd => !sd.menuDishId);

      // Cập nhật các món ăn đã tồn tại (nếu có thay đổi)
      // Note: Các thay đổi đã được lưu real-time khi người dùng chỉnh sửa

      // Thêm các món ăn mới
      if (newDishes.length > 0) {
        const addDishPromises = newDishes.map(selectedDish =>
          postAccess(`menus/${menuId}/dishes`, {
            dish_id: parseInt(selectedDish.dish.id),
            stock: selectedDish.stock,
            price: selectedDish.price,
          }),
        );
        await Promise.all(addDishPromises);
      }

      Alert.alert('Thành công', 'Cập nhật thực đơn thành công', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        handleSessionExpired();
        return;
      }
      console.error('handleSaveMenu error', err);
      Alert.alert('Lỗi', err?.message || 'Không thể cập nhật thực đơn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingMenu) {
    return (
      <SafeAreaView style={mealStyles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={mealStyles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.purple} />
          <Text style={mealStyles.loaderText}>Đang tải thông tin thực đơn...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={mealStyles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={mealStyles.header}>
        <TouchableOpacity onPress={handleBack} style={mealStyles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.darkGrey} />
        </TouchableOpacity>
        <Text style={mealStyles.headerTitle}>Sửa thực đơn</Text>
        <View style={mealStyles.notificationButton} />
      </View>

      <ScrollView
        style={mealStyles.scrollView}
        contentContainerStyle={[mealStyles.scrollContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Gia đình (read-only) */}
        <View style={mealStyles.menuCard}>
          <Text style={mealStyles.sectionLabel}>Gia đình</Text>
          <View
            style={{
              marginTop: 8,
              padding: 12,
              borderWidth: 1,
              borderColor: COLORS.grey,
              borderRadius: 12,
              backgroundColor: '#F5F5F5',
            }}
          >
            <Text style={{ fontSize: 16, color: COLORS.darkGrey }}>
              {family?.name || 'Không xác định'}
            </Text>
          </View>
        </View>

        {/* Mô tả */}
        <View style={mealStyles.menuCard}>
          <Text style={mealStyles.sectionLabel}>Mô tả</Text>
          <TextInput
            style={{
              marginTop: 8,
              padding: 12,
              borderWidth: 1,
              borderColor: COLORS.grey,
              borderRadius: 12,
              fontSize: 16,
              color: COLORS.darkGrey,
              minHeight: 80,
              textAlignVertical: 'top',
            }}
            placeholder="Nhập mô tả cho thực đơn"
            placeholderTextColor={COLORS.grey}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Danh sách món ăn đã chọn */}
        <View style={mealStyles.menuCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={mealStyles.sectionLabel}>Món ăn *</Text>
            <TouchableOpacity
              onPress={() => setShowDishModal(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: COLORS.purple,
                borderRadius: 8,
              }}
            >
              <Ionicons name="add" size={18} color={COLORS.white} />
              <Text style={{ color: COLORS.white, marginLeft: 4, fontSize: 14, fontWeight: '600' }}>
                Thêm món
              </Text>
            </TouchableOpacity>
          </View>

          {selectedDishes.length === 0 ? (
            <Text style={{ color: COLORS.grey, fontStyle: 'italic', marginTop: 8 }}>
              Chưa có món ăn nào. Nhấn &quot;Thêm món&quot; để thêm.
            </Text>
          ) : (
            <View style={{ gap: 12, marginTop: 8 }}>
              {selectedDishes.map(selectedDish => (
                <View
                  key={selectedDish.dish.id}
                  style={{
                    flexDirection: 'row',
                    backgroundColor: '#F8F9FB',
                    borderRadius: 12,
                    padding: 12,
                    gap: 12,
                  }}
                >
                  {selectedDish.dish.image_url ? (
                    <Image
                      source={{ uri: selectedDish.dish.image_url }}
                      style={{ width: 60, height: 60, borderRadius: 8 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 8,
                        backgroundColor: '#E8EAF6',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons name="restaurant-outline" size={24} color={COLORS.grey} />
                    </View>
                  )}

                  <View style={{ flex: 1, gap: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.darkGrey, flex: 1 }}>
                        {selectedDish.dish.name}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveDish(selectedDish)}
                        style={{ padding: 4 }}
                      >
                        <Ionicons name="close-circle" size={20} color={COLORS.orange} />
                      </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, color: COLORS.grey, marginBottom: 4 }}>Số lượng</Text>
                        <TextInput
                          style={{
                            padding: 8,
                            borderWidth: 1,
                            borderColor: COLORS.grey,
                            borderRadius: 8,
                            fontSize: 14,
                            color: COLORS.darkGrey,
                          }}
                          placeholder="0"
                          placeholderTextColor={COLORS.grey}
                          value={selectedDish.stock.toString()}
                          onChangeText={text => {
                            const num = parseInt(text) || 0;
                            handleUpdateDish(selectedDish, 'stock', num);
                          }}
                          keyboardType="numeric"
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, color: COLORS.grey, marginBottom: 4 }}>Giá (₫)</Text>
                        <TextInput
                          style={{
                            padding: 8,
                            borderWidth: 1,
                            borderColor: COLORS.grey,
                            borderRadius: 8,
                            fontSize: 14,
                            color: COLORS.darkGrey,
                          }}
                          placeholder="0"
                          placeholderTextColor={COLORS.grey}
                          value={selectedDish.price.toString()}
                          onChangeText={text => {
                            const num = parseInt(text) || 0;
                            handleUpdateDish(selectedDish, 'price', num);
                          }}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Nút lưu */}
        <TouchableOpacity
          onPress={handleSaveMenu}
          disabled={loading || selectedDishes.length === 0}
          style={{
            marginTop: 16,
            padding: 16,
            backgroundColor: loading || selectedDishes.length === 0 ? COLORS.grey : COLORS.purple,
            borderRadius: 12,
            alignItems: 'center',
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '600' }}>Lưu thay đổi</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Modal chọn món ăn */}
      <Modal visible={showDishModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' }}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.darkGrey }}>Chọn món ăn</Text>
                <TouchableOpacity onPress={() => setShowDishModal(false)}>
                  <Ionicons name="close" size={24} color={COLORS.darkGrey} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={{
                  padding: 12,
                  borderWidth: 1,
                  borderColor: COLORS.grey,
                  borderRadius: 8,
                  fontSize: 16,
                  color: COLORS.darkGrey,
                }}
                placeholder="Tìm kiếm món ăn..."
                placeholderTextColor={COLORS.grey}
                value={searchQuery}
                onChangeText={text => {
                  setSearchQuery(text);
                  fetchDishes(1, true);
                }}
              />
            </View>
            <FlatList
              data={dishes}
              keyExtractor={item => item.id}
              renderItem={({ item }) => {
                const isSelected = selectedDishes.some(sd => sd.dish.id === item.id);
                return (
                  <TouchableOpacity
                    onPress={() => handleAddDish(item)}
                    disabled={isSelected}
                    style={{
                      padding: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: '#F0F0F0',
                      flexDirection: 'row',
                      gap: 12,
                      opacity: isSelected ? 0.5 : 1,
                    }}
                  >
                    {item.image_url ? (
                      <Image
                        source={{ uri: item.image_url }}
                        style={{ width: 60, height: 60, borderRadius: 8 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 8,
                          backgroundColor: '#E8EAF6',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Ionicons name="restaurant-outline" size={24} color={COLORS.grey} />
                      </View>
                    )}
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.darkGrey }}>
                        {item.name}
                      </Text>
                      {isSelected && (
                        <Text style={{ fontSize: 12, color: COLORS.purple, marginTop: 4 }}>
                          Đã được thêm
                        </Text>
                      )}
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={24} color={COLORS.purple} />}
                  </TouchableOpacity>
                );
              }}
              ListFooterComponent={
                hasNextDishPage ? (
                  <TouchableOpacity
                    onPress={() => fetchDishes(dishPage + 1, false)}
                    disabled={loadingDishes}
                    style={{ padding: 16, alignItems: 'center' }}
                  >
                    {loadingDishes ? (
                      <ActivityIndicator size="small" color={COLORS.purple} />
                    ) : (
                      <Text style={{ color: COLORS.purple, fontWeight: '600' }}>Tải thêm</Text>
                    )}
                  </TouchableOpacity>
                ) : null
              }
              ListEmptyComponent={
                !loadingDishes ? (
                  <View style={{ padding: 40, alignItems: 'center' }}>
                    <Text style={{ color: COLORS.grey }}>Không tìm thấy món ăn nào</Text>
                  </View>
                ) : null
              }
            />
            {loadingDishes && dishes.length === 0 && (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.purple} />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

