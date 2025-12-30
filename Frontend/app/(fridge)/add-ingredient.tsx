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
import { addIngredientToRefrigerator } from '@/service/fridge';
import { searchIngredients } from '@/service/market';

interface Ingredient {
  id: number;
  name: string;
  image_url: string | null;
  category?: {
    id: number;
    name: string;
  };
}

export default function AddIngredientPage() {
  const router = useRouter();
  const { refrigeratorId } = useLocalSearchParams();
  const fridgeId = parseInt(refrigeratorId as string);
  const sessionExpiredRef = useRef(false);

  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stock, setStock] = useState('');
  const [price, setPrice] = useState('');
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingIngredients, setLoadingIngredients] = useState(false);

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

  const fetchIngredients = useCallback(
    async () => {
      if (!searchQuery.trim()) {
        setIngredients([]);
        return;
      }

      setLoadingIngredients(true);
      try {
        const response = await searchIngredients({
          name: searchQuery,
          page: 1,
          limit: 20,
        });

        // Handle different response formats
        const ingredientsData = Array.isArray(response)
          ? response
          : (response?.data || []);

        setIngredients(ingredientsData);
      } catch (err: any) {
        if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
          handleSessionExpired();
          return;
        }
        console.error('fetchIngredients error', err);
        setIngredients([]);
      } finally {
        setLoadingIngredients(false);
      }
    },
    [searchQuery, handleSessionExpired],
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchIngredients();
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [fetchIngredients]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(`/(fridge)/${fridgeId}` as any);
    }
  };

  const handleSelectIngredient = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
  };

  const handleSubmit = async () => {
    if (!selectedIngredient) {
      Alert.alert('Lỗi', 'Vui lòng chọn nguyên liệu');
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
      // Ensure ingredient_id is a number
      const ingredientId = typeof selectedIngredient.id === 'string'
        ? parseInt(selectedIngredient.id, 10)
        : Number(selectedIngredient.id);
      
      if (isNaN(ingredientId) || ingredientId <= 0) {
        Alert.alert('Lỗi', 'ID nguyên liệu không hợp lệ');
        setLoading(false);
        return;
      }

      const data: any = {
        ingredient_id: ingredientId,
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

      await addIngredientToRefrigerator(fridgeId, data);

      Alert.alert('Thành công', 'Đã thêm nguyên liệu vào tủ lạnh!', [
        {
          text: 'OK',
          onPress: () => {
            router.back();
          },
        },
      ]);
    } catch (err: any) {
      console.error('Error adding ingredient:', err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể thêm nguyên liệu. Vui lòng thử lại.';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderIngredientItem = ({ item }: { item: Ingredient }) => (
    <TouchableOpacity
      style={{
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        borderWidth: 2,
        borderColor: selectedIngredient?.id === item.id ? COLORS.primary : 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}
      onPress={() => handleSelectIngredient(item)}
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
          <Ionicons name="leaf" size={24} color={COLORS.grey} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.darkGrey }}>
          {item.name}
        </Text>
        {item.category && (
          <Text style={{ fontSize: 14, color: COLORS.grey, marginTop: 4 }}>
            {item.category.name}
          </Text>
        )}
      </View>
      {selectedIngredient?.id === item.id && (
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
          Thêm nguyên liệu
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
            placeholder="Tìm kiếm nguyên liệu..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.grey}
          />
        </View>

        {/* Ingredient List */}
        {loadingIngredients ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : searchQuery.trim() && ingredients.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Ionicons name="leaf-outline" size={64} color={COLORS.grey} />
            <Text style={{ marginTop: 16, fontSize: 16, color: COLORS.grey }}>
              Không tìm thấy nguyên liệu
            </Text>
          </View>
        ) : searchQuery.trim() && ingredients.length > 0 ? (
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: COLORS.darkGrey,
                marginBottom: 12,
              }}
            >
              Chọn nguyên liệu
            </Text>
            <FlatList
              data={ingredients}
              renderItem={renderIngredientItem}
              keyExtractor={item => item.id.toString()}
              scrollEnabled={false}
            />
          </View>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Ionicons name="search-outline" size={64} color={COLORS.grey} />
            <Text style={{ marginTop: 16, fontSize: 16, color: COLORS.grey }}>
              Nhập tên nguyên liệu để tìm kiếm
            </Text>
          </View>
        )}

        {/* Selected Ingredient Info */}
        {selectedIngredient && (
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
              Nguyên liệu đã chọn
            </Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.darkGrey }}>
              {selectedIngredient.name}
            </Text>
            {selectedIngredient.category && (
              <Text style={{ fontSize: 14, color: COLORS.grey, marginTop: 4 }}>
                {selectedIngredient.category.name}
              </Text>
            )}
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
            opacity: selectedIngredient ? 1 : 0.5,
          }}
          onPress={handleSubmit}
          disabled={loading || !selectedIngredient}
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

