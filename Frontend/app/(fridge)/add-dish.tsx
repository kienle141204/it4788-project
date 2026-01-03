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
  FlatList,
  Image,
  Platform,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS } from '@/constants/themes';
import { addDishToRefrigerator, getRefrigeratorDishes } from '@/service/fridge';
import { getAccess } from '@/utils/api';

interface Dish {
  id: number;
  name: string;
  image_url: string | null;
  description?: string;
}

const PAGE_LIMIT = 20;

export default function AddDishPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { refrigeratorId } = useLocalSearchParams();
  const fridgeId = parseInt(refrigeratorId as string);
  const sessionExpiredRef = useRef(false);

  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stock, setStock] = useState('');
  const [price, setPrice] = useState('');
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDishes, setLoadingDishes] = useState(false);
  const [dishPage, setDishPage] = useState(1);
  const [hasNextDishPage, setHasNextDishPage] = useState(false);
  const [showDishModal, setShowDishModal] = useState(false);
  const [existingDishes, setExistingDishes] = useState<number[]>([]);

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

  const fetchExistingDishes = useCallback(async () => {
    try {
      const response = await getRefrigeratorDishes(fridgeId);
      const dishesData = Array.isArray(response) ? response : (response?.data || []);
      const dishIds = dishesData.map((item: any) => item.dish_id).filter(Boolean);
      setExistingDishes(dishIds);
    } catch (err: any) {
      // Ignore errors, just set empty array
      setExistingDishes([]);
    }
  }, [fridgeId]);

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
      } finally {
        setLoadingDishes(false);
      }
    },
    [searchQuery, handleSessionExpired],
  );

  useEffect(() => {
    fetchExistingDishes();
  }, [fetchExistingDishes]);

  useEffect(() => {
    if (showDishModal) {
      fetchDishes(1, true);
    }
  }, [showDishModal, fetchDishes]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(`/(fridge)/${fridgeId}` as any);
    }
  };

  const handleSelectDish = (dish: Dish) => {
    setSelectedDish(dish);
    setShowDishModal(false);
  };

  const handleSubmit = async () => {
    if (!selectedDish) {
      Alert.alert('Lỗi', 'Vui lòng chọn món ăn');
      return;
    }

    if (!stock.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số lượng');
      return;
    }

    setLoading(true);
    try {
      await addDishToRefrigerator(fridgeId, {
        dish_id: selectedDish.id,
        stock: parseInt(stock) || undefined,
        price: price.trim() ? parseFloat(price) : undefined,
        expiration_date: expirationDate ? expirationDate.toISOString().split('T')[0] : undefined,
      });

      Alert.alert('Thành công', 'Đã thêm món ăn vào tủ lạnh', [
        {
          text: 'OK',
          onPress: () => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace(`/(fridge)/${fridgeId}` as any);
            }
          },
        },
      ]);
    } catch (err: any) {
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        handleSessionExpired();
        return;
      }
      Alert.alert('Lỗi', err?.message || 'Không thể thêm món ăn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const renderDishItem = ({ item }: { item: Dish }) => {
    const isSelected = existingDishes.includes(item.id);
    const isChosen = selectedDish?.id === item.id;
    return (
      <TouchableOpacity
        onPress={() => handleSelectDish(item)}
        disabled={isSelected}
        style={{
          padding: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#F0F0F0',
          flexDirection: 'row',
          gap: 12,
          opacity: isSelected ? 0.5 : 1,
          backgroundColor: isChosen ? '#E0F2FE' : 'transparent',
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
            <Text style={{ fontSize: 12, color: COLORS.primary, marginTop: 4 }}>
              Đã có trong tủ lạnh
            </Text>
          )}
          {isChosen && !isSelected && (
            <Text style={{ fontSize: 12, color: COLORS.primary, marginTop: 4 }}>
              Đã chọn
            </Text>
          )}
        </View>
        {isSelected && <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />}
        {isChosen && !isSelected && <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background || COLORS.white }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: Math.max(insets.top, 16) + 10,
          paddingBottom: 16,
          backgroundColor: COLORS.white,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.background || '#F5F5F5',
        }}
      >
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.darkGrey} />
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: COLORS.darkGrey,
          }}
        >
          Thêm món ăn
        </Text>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Selected Dish Info */}
        {selectedDish && (
          <View
            style={{
              backgroundColor: '#E0F2FE',
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: COLORS.primary,
                marginBottom: 8,
              }}
            >
              Món ăn đã chọn
            </Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.darkGrey }}>
              {selectedDish.name}
            </Text>
            {selectedDish.description && (
              <Text
                style={{ fontSize: 14, color: COLORS.grey, marginTop: 4 }}
                numberOfLines={2}
              >
                {selectedDish.description}
              </Text>
            )}
          </View>
        )}

        {/* Search Button */}
        {!selectedDish && (
          <TouchableOpacity
            style={{
              backgroundColor: COLORS.primary,
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              marginBottom: 24,
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}
            onPress={() => setShowDishModal(true)}
          >
            <Ionicons name="search" size={20} color={COLORS.white} />
            <Text style={{ color: COLORS.white, fontWeight: '600', fontSize: 16 }}>
              Tìm kiếm món ăn
            </Text>
          </TouchableOpacity>
        )}

        {/* Stock Input */}
        {selectedDish && (
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: COLORS.darkGrey,
                marginBottom: 8,
              }}
            >
              Số lượng <Text style={{ color: COLORS.red || '#EF4444' }}>*</Text>
            </Text>
            <TextInput
              style={{
                backgroundColor: COLORS.white,
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                borderWidth: 1,
                borderColor: COLORS.background || '#E5E5E5',
              }}
              placeholder="Nhập số lượng"
              value={stock}
              onChangeText={setStock}
              keyboardType="numeric"
              placeholderTextColor={COLORS.grey}
            />
          </View>
        )}

        {/* Price Input (Optional) */}
        {selectedDish && (
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: COLORS.darkGrey,
                marginBottom: 8,
              }}
            >
              Giá (tùy chọn)
            </Text>
            <TextInput
              style={{
                backgroundColor: COLORS.white,
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                borderWidth: 1,
                borderColor: COLORS.background || '#E5E5E5',
              }}
              placeholder="Nhập giá"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              placeholderTextColor={COLORS.grey}
            />
          </View>
        )}

        {/* Expiration Date Input (Optional) */}
        {selectedDish && (
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: COLORS.darkGrey,
                marginBottom: 8,
              }}
            >
              Ngày hết hạn (tùy chọn)
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: COLORS.white,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: COLORS.background || '#E5E5E5',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              onPress={() => setShowDatePicker(true)}
            >
              <Text
                style={{
                  fontSize: 16,
                  color: expirationDate ? COLORS.darkGrey : COLORS.grey,
                }}
              >
                {expirationDate
                  ? expirationDate.toLocaleDateString('vi-VN')
                  : 'Chọn ngày hết hạn'}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={COLORS.grey} />
            </TouchableOpacity>
            {expirationDate && (
              <TouchableOpacity
                onPress={() => setExpirationDate(null)}
                style={{ marginTop: 8, alignSelf: 'flex-start' }}
              >
                <Text style={{ color: COLORS.red || '#EF4444', fontSize: 14 }}>
                  Xóa ngày hết hạn
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={expirationDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (event.type === 'set' && selectedDate) {
                setExpirationDate(selectedDate);
              }
            }}
          />
        )}

        {/* Submit Button */}
        {selectedDish && (
          <TouchableOpacity
            style={{
              backgroundColor: COLORS.primary,
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              marginTop: 8,
            }}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: COLORS.white,
                }}
              >
                Thêm vào tủ lạnh
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Change Dish Button */}
        {selectedDish && (
          <TouchableOpacity
            style={{
              marginTop: 12,
              padding: 12,
              alignItems: 'center',
            }}
            onPress={() => {
              setSelectedDish(null);
              setStock('');
              setPrice('');
              setExpirationDate(null);
            }}
          >
            <Text style={{ color: COLORS.grey, fontSize: 14 }}>Chọn lại món ăn</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Modal chọn món ăn */}
      <Modal visible={showDishModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 0 }}
          >
            <View style={{ backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' }}>
              <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.darkGrey }}>Chọn món ăn</Text>
                  <TouchableOpacity onPress={() => {
                    setShowDishModal(false);
                    setSearchQuery('');
                    setDishes([]);
                  }}>
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
                keyExtractor={item => item.id.toString()}
                renderItem={renderDishItem}
                ListFooterComponent={
                  hasNextDishPage ? (
                    <TouchableOpacity
                      onPress={() => fetchDishes(dishPage + 1, false)}
                      disabled={loadingDishes}
                      style={{ padding: 16, alignItems: 'center' }}
                    >
                      {loadingDishes ? (
                        <ActivityIndicator size="small" color={COLORS.primary} />
                      ) : (
                        <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Tải thêm</Text>
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
                  <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

