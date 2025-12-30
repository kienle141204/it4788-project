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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS } from '@/constants/themes';
import { addDishToRefrigerator } from '@/service/fridge';
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
  const [dateInput, setDateInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDishes, setLoadingDishes] = useState(false);
  const [dishPage, setDishPage] = useState(1);
  const [hasNextDishPage, setHasNextDishPage] = useState(false);

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
    const timeoutId = setTimeout(() => {
      fetchDishes(1, true);
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [fetchDishes]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(`/(fridge)/${fridgeId}` as any);
    }
  };

  const handleSelectDish = (dish: Dish) => {
    setSelectedDish(dish);
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

    const stockNum = parseInt(stock, 10);
    if (isNaN(stockNum) || stockNum <= 0) {
      Alert.alert('Lỗi', 'Số lượng phải là số dương');
      return;
    }

    setLoading(true);
    try {
      // Ensure dish_id is a number
      const dishId = typeof selectedDish.id === 'string'
        ? parseInt(selectedDish.id, 10)
        : Number(selectedDish.id);
      
      if (isNaN(dishId) || dishId <= 0) {
        Alert.alert('Lỗi', 'ID món ăn không hợp lệ');
        setLoading(false);
        return;
      }

      const data: any = {
        dish_id: dishId,
        stock: stockNum,
      };

      if (price.trim()) {
        const priceNum = parseFloat(price);
        if (!isNaN(priceNum) && priceNum >= 0) {
          data.price = priceNum;
        }
      }

      if (expirationDate) {
        data.expiration_date = expirationDate.toISOString().split('T')[0];
      }

      const response = await addDishToRefrigerator(fridgeId, data);

      Alert.alert('Thành công', 'Đã thêm món ăn vào tủ lạnh!', [
        {
          text: 'OK',
          onPress: () => {
            router.back();
          },
        },
      ]);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể thêm món ăn. Vui lòng thử lại.';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderDishItem = ({ item }: { item: Dish }) => (
    <TouchableOpacity
      style={{
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        borderWidth: 2,
        borderColor: selectedDish?.id === item.id ? COLORS.primary : 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}
      onPress={() => handleSelectDish(item)}
    >
      {item.image_url ? (
        <Image
          source={{ uri: item.image_url }}
          style={{ width: 60, height: 60, borderRadius: 8, marginRight: 12 }}
        />
      ) : (
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 8,
            backgroundColor: '#F3F4F6',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
          }}
        >
          <Ionicons name="restaurant" size={24} color={COLORS.grey} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.darkGrey }}>
          {item.name}
        </Text>
        {item.description && (
          <Text
            style={{ fontSize: 14, color: COLORS.grey, marginTop: 4 }}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        )}
      </View>
      {selectedDish?.id === item.id && (
        <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background || COLORS.white }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 16,
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
        {/* Search */}
        <View style={{ marginBottom: 24 }}>
          <TextInput
            style={{
              backgroundColor: COLORS.white,
              borderRadius: 12,
              padding: 16,
              fontSize: 16,
              borderWidth: 1,
              borderColor: COLORS.background || '#E5E5E5',
            }}
            placeholder="Tìm kiếm món ăn..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.grey}
          />
        </View>

        {/* Dish List */}
        {loadingDishes ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : dishes.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Ionicons name="restaurant-outline" size={64} color={COLORS.grey} />
            <Text style={{ marginTop: 16, fontSize: 16, color: COLORS.grey }}>
              Không tìm thấy món ăn
            </Text>
          </View>
        ) : (
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: COLORS.darkGrey,
                marginBottom: 12,
              }}
            >
              Chọn món ăn
            </Text>
            <FlatList
              data={dishes}
              renderItem={renderDishItem}
              keyExtractor={item => item.id.toString()}
              scrollEnabled={false}
            />
          </View>
        )}

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
          </View>
        )}

        {/* Stock Input */}
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

        {/* Price Input (Optional) */}
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

        {/* Expiration Date Input (Optional) */}
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
        <TouchableOpacity
          style={{
            backgroundColor: COLORS.primary,
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
            marginTop: 8,
          }}
          onPress={handleSubmit}
          disabled={loading || !selectedDish}
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
      </ScrollView>
    </SafeAreaView>
  );
}

