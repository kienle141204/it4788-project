import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { COLORS } from '@/constants/themes';
import {
  getRefrigeratorById,
  getRefrigeratorDishes,
  getRefrigeratorIngredients,
  getDishSuggestions,
  deleteRefrigerator,
  removeFridgeDish,
  removeFridgeIngredient,
  updateRefrigerator,
} from '@/service/fridge';
import ActionMenu from '@/components/ActionMenu';

interface Refrigerator {
  id: number;
  owner_id: number;
  family_id?: number | null;
  created_at: string;
}

interface FridgeDish {
  id: number;
  refrigerator_id: number;
  dish_id: number;
  stock?: number;
  price?: number;
  expiration_date?: string | null;
  dish?: {
    id: number;
    name: string;
    image_url?: string | null;
    description?: string;
  };
}

interface FridgeIngredient {
  id: number;
  refrigerator_id: number;
  ingredient_id?: number;
  dish_ingredient_id?: number;
  stock?: number;
  price?: number;
  expiration_date?: string | null;
  ingredient?: {
    id: number;
    name: string;
    image_url?: string | null;
  };
}

interface DishSuggestion {
  dishId: number;
  dishName: string;
  matchCount: number;
  totalIngredients: number;
  matchPercentage: number;
  matchedIngredients: string[];
  missingIngredients: string[];
}

export default function FridgeDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const refrigeratorId = parseInt(id as string);
  const sessionExpiredRef = useRef(false);

  const [activeTab, setActiveTab] = useState<'dishes' | 'ingredients' | 'suggestions'>('dishes');
  const [refrigerator, setRefrigerator] = useState<Refrigerator | null>(null);
  const [dishes, setDishes] = useState<FridgeDish[]>([]);
  const [ingredients, setIngredients] = useState<FridgeIngredient[]>([]);
  const [suggestions, setSuggestions] = useState<DishSuggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);

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

  const fetchRefrigeratorData = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch refrigerator details
      const fridgeData = await getRefrigeratorById(refrigeratorId);
      setRefrigerator(fridgeData);

      // Fetch dishes and ingredients - handle 404 as empty arrays
      let dishesData: any[] = [];
      let ingredientsData: any[] = [];
      
      try {
        const dishesResponse = await getRefrigeratorDishes(refrigeratorId);
        console.log('[FridgeDetail] Dishes response:', dishesResponse);
        // Backend trả về { success, message, data, pagination }
        if (dishesResponse?.data && Array.isArray(dishesResponse.data)) {
          dishesData = dishesResponse.data;
        } else if (Array.isArray(dishesResponse)) {
          dishesData = dishesResponse;
        } else {
          dishesData = [];
        }
        console.log('[FridgeDetail] Processed dishes:', dishesData);
      } catch (dishErr: any) {
        // 404 means no dishes yet - this is normal, not an error
        const is404NoDishes = dishErr?.response?.status === 404 && 
          (dishErr?.response?.data?.message?.includes('Không tìm thấy món ăn') ||
           dishErr?.response?.data?.message?.includes('not found'));
        if (!is404NoDishes) {
          console.error('Error fetching dishes:', dishErr);
        }
        dishesData = [];
      }
      
      try {
        const ingredientsResponse = await getRefrigeratorIngredients(refrigeratorId);
        console.log('[FridgeDetail] Ingredients response:', ingredientsResponse);
        // Backend trả về { success, message, data, pagination }
        if (ingredientsResponse?.data && Array.isArray(ingredientsResponse.data)) {
          ingredientsData = ingredientsResponse.data;
        } else if (Array.isArray(ingredientsResponse)) {
          ingredientsData = ingredientsResponse;
        } else {
          ingredientsData = [];
        }
        console.log('[FridgeDetail] Processed ingredients:', ingredientsData);
      } catch (ingredientErr: any) {
        // 404 means no ingredients yet - this is normal, not an error
        const is404NoIngredients = ingredientErr?.response?.status === 404 && 
          (ingredientErr?.response?.data?.message?.includes('Không tìm thấy nguyên liệu') ||
           ingredientErr?.response?.data?.message?.includes('not found'));
        if (!is404NoIngredients) {
          console.error('Error fetching ingredients:', ingredientErr);
        }
        ingredientsData = [];
      }

      setDishes(dishesData);
      setIngredients(ingredientsData);
    } catch (err: any) {
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        handleSessionExpired();
        return;
      }
      console.error('Error fetching refrigerator data:', err);
      setError('Không thể tải thông tin tủ lạnh. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refrigeratorId, handleSessionExpired]);

  const fetchSuggestions = useCallback(async () => {
    try {
      setLoadingSuggestions(true);
      setSuggestionsError(null);
      const suggestionsData = await getDishSuggestions(refrigeratorId);
      setSuggestions(Array.isArray(suggestionsData) ? suggestionsData : []);
    } catch (err: any) {
      console.error('Error fetching suggestions:', err);
      setSuggestions([]);
      // Kiểm tra nếu là lỗi database connection
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải gợi ý món ăn';
      if (errorMessage.includes('kết nối') || errorMessage.includes('ETIMEDOUT') || err?.response?.status === 500) {
        setSuggestionsError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối và thử lại.');
      } else {
        setSuggestionsError(errorMessage);
      }
    } finally {
      setLoadingSuggestions(false);
    }
  }, [refrigeratorId]);

  useEffect(() => {
    fetchRefrigeratorData();
  }, [fetchRefrigeratorData]);

  useFocusEffect(
    useCallback(() => {
      fetchRefrigeratorData(true);
      if (activeTab === 'suggestions') {
        fetchSuggestions();
      }
    }, [fetchRefrigeratorData, activeTab, fetchSuggestions])
  );

  useEffect(() => {
    if (activeTab === 'suggestions') {
      fetchSuggestions();
    }
  }, [activeTab, fetchSuggestions]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(fridge)' as any);
    }
  };

  const handleAddDish = () => {
    router.push(`/(fridge)/add-dish?refrigeratorId=${refrigeratorId}` as any);
  };

  const handleAddIngredient = () => {
    router.push(`/(fridge)/add-ingredient?refrigeratorId=${refrigeratorId}` as any);
  };

  const handleDeleteDish = async (dishId: number) => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn xóa món ăn này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeFridgeDish(dishId);
            fetchRefrigeratorData(true);
          } catch (err: any) {
            Alert.alert('Lỗi', 'Không thể xóa món ăn. Vui lòng thử lại.');
          }
        },
      },
    ]);
  };

  const handleDeleteIngredient = async (ingredientId: number) => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn xóa nguyên liệu này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeFridgeIngredient(ingredientId);
            fetchRefrigeratorData(true);
          } catch (err: any) {
            Alert.alert('Lỗi', 'Không thể xóa nguyên liệu. Vui lòng thử lại.');
          }
        },
      },
    ]);
  };

  const handleDeleteRefrigerator = async () => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn xóa tủ lạnh này? Tất cả món ăn và nguyên liệu sẽ bị xóa.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRefrigerator(refrigeratorId);
              Alert.alert('Thành công', 'Đã xóa tủ lạnh thành công', [
                {
                  text: 'OK',
                  onPress: () => router.replace('/(fridge)' as any),
                },
              ]);
            } catch (err: any) {
              Alert.alert('Lỗi', 'Không thể xóa tủ lạnh. Vui lòng thử lại.');
            }
          },
        },
      ]
    );
  };

  const getMenuOptions = () => {
    return [
      {
        label: 'Xóa tủ lạnh',
        icon: 'trash-outline' as const,
        onPress: () => {
          setShowMenu(false);
          handleDeleteRefrigerator();
        },
        destructive: true,
      },
    ];
  };

  // Helper function to calculate days until expiration and get color
  const getExpirationInfo = (expirationDate: string | null | undefined) => {
    if (!expirationDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expirationDate);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      // Đã hết hạn
      return {
        text: `Đã hết hạn ${Math.abs(diffDays)} ngày`,
        color: COLORS.red || '#EF4444',
        days: diffDays,
      };
    } else if (diffDays <= 3) {
      // Sắp hết hạn (≤ 3 ngày)
      return {
        text: `Còn ${diffDays} ngày`,
        color: '#F59E0B', // Orange
        days: diffDays,
      };
    } else {
      // Còn hạn
      return {
        text: `Hết hạn: ${expiry.toLocaleDateString('vi-VN')}`,
        color: COLORS.grey,
        days: diffDays,
      };
    }
  };

  const renderDishItem = ({ item }: { item: FridgeDish }) => (
    <View
      style={{
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      {item.dish?.image_url ? (
        <Image
          source={{ uri: item.dish.image_url }}
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
          {item.dish?.name || 'Món ăn'}
        </Text>
        {item.stock !== undefined && (
          <Text style={{ fontSize: 14, color: COLORS.grey, marginTop: 4 }}>
            Số lượng: {item.stock}
          </Text>
        )}
        {item.price !== undefined && item.price !== null && typeof item.price === 'number' && (
          <Text style={{ fontSize: 14, color: COLORS.grey, marginTop: 2 }}>
            Giá: {item.price.toLocaleString('vi-VN')} đ
          </Text>
        )}
        {(() => {
          const expInfo = getExpirationInfo(item.expiration_date);
          if (expInfo) {
            return (
              <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="time-outline" size={14} color={expInfo.color} />
                <Text style={{ fontSize: 13, color: expInfo.color, marginLeft: 4, fontWeight: '500' }}>
                  {expInfo.text}
                </Text>
              </View>
            );
          }
          return null;
        })()}
      </View>
      <TouchableOpacity
        onPress={() => handleDeleteDish(item.id)}
        style={{ padding: 8 }}
      >
        <Ionicons name="trash-outline" size={20} color={COLORS.red || '#EF4444'} />
      </TouchableOpacity>
    </View>
  );

  const renderIngredientItem = ({ item }: { item: FridgeIngredient }) => (
    <View
      style={{
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      {item.ingredient?.image_url ? (
        <Image
          source={{ uri: item.ingredient.image_url }}
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
          {item.ingredient?.name || 'Nguyên liệu'}
        </Text>
        {item.stock !== undefined && (
          <Text style={{ fontSize: 14, color: COLORS.grey, marginTop: 4 }}>
            Số lượng: {item.stock}
          </Text>
        )}
        {item.price !== undefined && item.price !== null && typeof item.price === 'number' && (
          <Text style={{ fontSize: 14, color: COLORS.grey, marginTop: 2 }}>
            Giá: {item.price.toLocaleString('vi-VN')} đ
          </Text>
        )}
        {(() => {
          const expInfo = getExpirationInfo(item.expiration_date);
          if (expInfo) {
            return (
              <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="time-outline" size={14} color={expInfo.color} />
                <Text style={{ fontSize: 13, color: expInfo.color, marginLeft: 4, fontWeight: '500' }}>
                  {expInfo.text}
                </Text>
              </View>
            );
          }
          return null;
        })()}
      </View>
      <TouchableOpacity
        onPress={() => handleDeleteIngredient(item.id)}
        style={{ padding: 8 }}
      >
        <Ionicons name="trash-outline" size={20} color={COLORS.red || '#EF4444'} />
      </TouchableOpacity>
    </View>
  );

  const renderSuggestionItem = ({ item }: { item: DishSuggestion }) => (
    <TouchableOpacity
      style={{
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}
      onPress={() => router.push(`/(food)/${item.dishId}` as any)}
    >
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
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.darkGrey }}>
          {item.dishName}
        </Text>
        <Text style={{ fontSize: 14, color: COLORS.grey, marginTop: 4 }}>
          Khớp: {item.matchCount}/{item.totalIngredients} nguyên liệu ({Math.round(item.matchPercentage * 100)}%)
        </Text>
        {item.matchedIngredients.length > 0 && (
          <Text
            style={{ fontSize: 12, color: COLORS.primary, marginTop: 4 }}
            numberOfLines={1}
          >
            Có: {item.matchedIngredients.join(', ')}
          </Text>
        )}
        {item.missingIngredients.length > 0 && (
          <Text
            style={{ fontSize: 12, color: '#EF4444', marginTop: 2 }}
            numberOfLines={1}
          >
            Thiếu: {item.missingIngredients.join(', ')}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.grey} />
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (activeTab === 'dishes') {
      return (
        <>
          {dishes.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Ionicons name="restaurant-outline" size={64} color={COLORS.grey} />
              <Text style={{ marginTop: 16, fontSize: 16, color: COLORS.grey }}>
                Chưa có món ăn nào
              </Text>
            </View>
          ) : (
            <FlatList
              data={dishes}
              renderItem={renderDishItem}
              keyExtractor={item => item.id.toString()}
              scrollEnabled={false}
            />
          )}
          <TouchableOpacity
            style={{
              backgroundColor: COLORS.primary,
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              marginTop: 16,
            }}
            onPress={handleAddDish}
          >
            <Ionicons name="add" size={24} color={COLORS.white} />
            <Text style={{ color: COLORS.white, fontWeight: '600', marginTop: 4 }}>
              Thêm món ăn
            </Text>
          </TouchableOpacity>
        </>
      );
    }

    if (activeTab === 'ingredients') {
      return (
        <>
          {ingredients.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Ionicons name="leaf-outline" size={64} color={COLORS.grey} />
              <Text style={{ marginTop: 16, fontSize: 16, color: COLORS.grey }}>
                Chưa có nguyên liệu nào
              </Text>
            </View>
          ) : (
            <FlatList
              data={ingredients}
              renderItem={renderIngredientItem}
              keyExtractor={item => item.id.toString()}
              scrollEnabled={false}
            />
          )}
          <TouchableOpacity
            style={{
              backgroundColor: COLORS.primary,
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              marginTop: 16,
            }}
            onPress={handleAddIngredient}
          >
            <Ionicons name="add" size={24} color={COLORS.white} />
            <Text style={{ color: COLORS.white, fontWeight: '600', marginTop: 4 }}>
              Thêm nguyên liệu
            </Text>
          </TouchableOpacity>
        </>
      );
    }

    if (activeTab === 'suggestions') {
      return (
        <>
          {loadingSuggestions ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : suggestionsError ? (
            <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 }}>
              <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
              <Text style={{ marginTop: 16, fontSize: 16, color: COLORS.grey, textAlign: 'center' }}>
                {suggestionsError}
              </Text>
              <TouchableOpacity
                style={{
                  marginTop: 16,
                  backgroundColor: COLORS.primary,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 8,
                }}
                onPress={fetchSuggestions}
              >
                <Text style={{ color: COLORS.white, fontWeight: '600' }}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : suggestions.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Ionicons name="bulb-outline" size={64} color={COLORS.grey} />
              <Text style={{ marginTop: 16, fontSize: 16, color: COLORS.grey }}>
                Không có gợi ý món ăn
              </Text>
            </View>
          ) : (
            <FlatList
              data={suggestions}
              renderItem={renderSuggestionItem}
              keyExtractor={(item, index) => item.dishId?.toString() || index.toString()}
              scrollEnabled={false}
            />
          )}
        </>
      );
    }

    return null;
  };

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
          {refrigerator?.family_id ? 'Tủ lạnh Gia đình' : 'Tủ lạnh Cá nhân'}
        </Text>

        <TouchableOpacity onPress={() => setShowMenu(true)}>
          <Ionicons name="ellipsis-vertical" size={24} color={COLORS.darkGrey} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: COLORS.white,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.background || '#F5F5F5',
        }}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 16,
            alignItems: 'center',
            borderBottomWidth: 2,
            borderBottomColor: activeTab === 'dishes' ? COLORS.primary : 'transparent',
          }}
          onPress={() => setActiveTab('dishes')}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: activeTab === 'dishes' ? 'bold' : '600',
              color: activeTab === 'dishes' ? COLORS.primary : COLORS.grey,
            }}
          >
            Món ăn
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 16,
            alignItems: 'center',
            borderBottomWidth: 2,
            borderBottomColor: activeTab === 'ingredients' ? COLORS.primary : 'transparent',
          }}
          onPress={() => setActiveTab('ingredients')}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: activeTab === 'ingredients' ? 'bold' : '600',
              color: activeTab === 'ingredients' ? COLORS.primary : COLORS.grey,
            }}
          >
            Nguyên liệu
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 16,
            alignItems: 'center',
            borderBottomWidth: 2,
            borderBottomColor: activeTab === 'suggestions' ? COLORS.primary : 'transparent',
          }}
          onPress={() => setActiveTab('suggestions')}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: activeTab === 'suggestions' ? 'bold' : '600',
              color: activeTab === 'suggestions' ? COLORS.primary : COLORS.grey,
            }}
          >
            Gợi ý
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 12, color: COLORS.grey }}>Đang tải...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.red || '#EF4444'} />
          <Text style={{ marginTop: 16, color: COLORS.darkGrey, fontSize: 16, textAlign: 'center' }}>
            {error}
          </Text>
          <TouchableOpacity
            style={{
              marginTop: 16,
              paddingHorizontal: 24,
              paddingVertical: 12,
              backgroundColor: COLORS.primary,
              borderRadius: 8,
            }}
            onPress={() => fetchRefrigeratorData()}
          >
            <Text style={{ color: COLORS.white, fontWeight: '600' }}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchRefrigeratorData(true)}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >
          {renderContent()}
        </ScrollView>
      )}

      {/* Menu */}
      <ActionMenu
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        title="Tùy chọn"
        options={getMenuOptions()}
      />
    </SafeAreaView>
  );
}

