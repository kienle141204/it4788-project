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
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  addDishToRefrigerator,
  addIngredientToRefrigerator,
  updateFridgeDish,
  updateFridgeIngredient,
} from '@/service/fridge';
import { getAccess } from '@/utils/api';
import { getCachedAccess, refreshCachedAccess, CACHE_TTL } from '@/utils/cachedApi';
import { clearCacheByPattern, getCache } from '@/utils/cache';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import ActionMenu from '@/components/ActionMenu';
import { useRefrigerator } from '@/context/RefrigeratorContext';

interface Refrigerator {
  id: number;
  name?: string;
  owner_id: number;
  family_id?: number | null;
  created_at: string;
  family?: {
    id: number;
    name: string;
  };
}

interface FridgeDish {
  id: number;
  refrigerator_id: number;
  dish_id: number;
  stock?: number;
  price?: number;
  expiration_date?: string | null;
  note?: string;
  created_at?: string;
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
  note?: string;
  created_at?: string;
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

interface Dish {
  id: number;
  name: string;
  image_url: string | null;
  description?: string;
}

interface Ingredient {
  id: number;
  name: string;
  image_url: string | null;
  category?: {
    id: number;
    name: string;
  };
}

const PAGE_LIMIT = 20;

export default function FridgeDetailPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const refrigeratorId = parseInt(id as string);
  const sessionExpiredRef = useRef(false);

  const [activeTab, setActiveTab] = useState<'dishes' | 'ingredients' | 'suggestions'>('dishes');
  const [refrigerator, setRefrigerator] = useState<Refrigerator | null>(null);
  const [fridgeDishes, setFridgeDishes] = useState<FridgeDish[]>([]);
  const [fridgeIngredients, setFridgeIngredients] = useState<FridgeIngredient[]>([]);
  const [suggestions, setSuggestions] = useState<DishSuggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);

  // Modal states for adding dish
  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [dishSearchQuery, setDishSearchQuery] = useState('');
  const [dishPage, setDishPage] = useState(1);
  const [hasNextDishPage, setHasNextDishPage] = useState(false);
  const [loadingDishes, setLoadingDishes] = useState(false);
  const [dishStock, setDishStock] = useState('');
  const [dishPrice, setDishPrice] = useState('');
  const [dishExpirationDate, setDishExpirationDate] = useState<Date | null>(null);
  const [dishNote, setDishNote] = useState('');
  const [showDishDatePicker, setShowDishDatePicker] = useState(false);
  const [addingDish, setAddingDish] = useState(false);
  const [showDishSelection, setShowDishSelection] = useState(true);

  // Modal states for adding ingredient
  const [showAddIngredientModal, setShowAddIngredientModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [ingredientSearchQuery, setIngredientSearchQuery] = useState('');
  const [ingredientPage, setIngredientPage] = useState(1);
  const [hasNextIngredientPage, setHasNextIngredientPage] = useState(false);
  const [loadingIngredients, setLoadingIngredients] = useState(false);
  const [ingredientStock, setIngredientStock] = useState('');
  const [ingredientPrice, setIngredientPrice] = useState('');
  const [ingredientExpirationDate, setIngredientExpirationDate] = useState<Date | null>(null);
  const [ingredientNote, setIngredientNote] = useState('');
  const [showIngredientDatePicker, setShowIngredientDatePicker] = useState(false);
  const [addingIngredient, setAddingIngredient] = useState(false);
  const [showIngredientSelection, setShowIngredientSelection] = useState(true);

  // Edit modal states
  const [showEditDishModal, setShowEditDishModal] = useState(false);
  const [showEditIngredientModal, setShowEditIngredientModal] = useState(false);
  const [editingDish, setEditingDish] = useState<FridgeDish | null>(null);
  const [editingIngredient, setEditingIngredient] = useState<FridgeIngredient | null>(null);
  const [editDishStock, setEditDishStock] = useState('');
  const [editDishPrice, setEditDishPrice] = useState('');
  const [editDishExpirationDate, setEditDishExpirationDate] = useState<Date | null>(null);
  const [editDishNote, setEditDishNote] = useState('');
  const [showEditDishDatePicker, setShowEditDishDatePicker] = useState(false);
  const [editIngredientStock, setEditIngredientStock] = useState('');
  const [editIngredientPrice, setEditIngredientPrice] = useState('');
  const [editIngredientExpirationDate, setEditIngredientExpirationDate] = useState<Date | null>(null);
  const [editIngredientNote, setEditIngredientNote] = useState('');
  const [showEditIngredientDatePicker, setShowEditIngredientDatePicker] = useState(false);
  const [updatingDish, setUpdatingDish] = useState(false);
  const [updatingIngredient, setUpdatingIngredient] = useState(false);

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
      setError(null);

      // Check cache first for initial load
      if (!isRefreshing) {
        const fridgeCacheKey = `fridge:${refrigeratorId}`;
        const dishesCacheKey = `fridge:${refrigeratorId}:dishes`;
        const ingredientsCacheKey = `fridge:${refrigeratorId}:ingredients`;
        
        const [cachedFridge, cachedDishes, cachedIngredients] = await Promise.all([
          getCache<any>(fridgeCacheKey),
          getCache<any>(dishesCacheKey),
          getCache<any>(ingredientsCacheKey),
        ]);
        
        if (cachedFridge) {
          // We have cache, show it immediately without loading
          setRefrigerator(cachedFridge);
          setLoading(false);
          
          if (cachedDishes) {
            const dishesData = cachedDishes?.data && Array.isArray(cachedDishes.data) 
              ? cachedDishes.data 
              : Array.isArray(cachedDishes) 
                ? cachedDishes 
                : [];
            setFridgeDishes(dishesData);
          }
          
          if (cachedIngredients) {
            const ingredientsData = cachedIngredients?.data && Array.isArray(cachedIngredients.data)
              ? cachedIngredients.data
              : Array.isArray(cachedIngredients)
                ? cachedIngredients
                : [];
            setFridgeIngredients(ingredientsData);
          }
          
          // Fetch fresh data in background
          Promise.all([
            refreshCachedAccess<any>(
              `fridge/${refrigeratorId}`,
              {},
              {
                ttl: CACHE_TTL.LONG,
                cacheKey: fridgeCacheKey,
                compareData: true,
              }
            ),
            getCachedAccess<any>(
              `fridge/${refrigeratorId}/dishes`,
              {},
              {
                ttl: CACHE_TTL.MEDIUM,
                cacheKey: dishesCacheKey,
                compareData: true,
              }
            ).catch(() => null),
            getCachedAccess<any>(
              `fridge/${refrigeratorId}/ingredients`,
              {},
              {
                ttl: CACHE_TTL.MEDIUM,
                cacheKey: ingredientsCacheKey,
                compareData: true,
              }
            ).catch(() => null),
          ]).then(([fridgeResult, dishesResult, ingredientsResult]) => {
            if (fridgeResult?.updated) {
              setRefrigerator(fridgeResult.data);
            }
            
            if (dishesResult && !dishesResult.fromCache) {
              const dishesData = dishesResult.data?.data && Array.isArray(dishesResult.data.data)
                ? dishesResult.data.data
                : Array.isArray(dishesResult.data)
                  ? dishesResult.data
                  : [];
              setFridgeDishes(dishesData);
            }
            
            if (ingredientsResult && !ingredientsResult.fromCache) {
              const ingredientsData = ingredientsResult.data?.data && Array.isArray(ingredientsResult.data.data)
                ? ingredientsResult.data.data
                : Array.isArray(ingredientsResult.data)
                  ? ingredientsResult.data
                  : [];
              setFridgeIngredients(ingredientsData);
            }
          }).catch(() => {
            // Silently fail background refresh
          });
          
          return;
        }
        
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      // Fetch refrigerator details with caching
      let fridgeData: any;
      if (isRefreshing) {
        const result = await refreshCachedAccess<any>(
          `fridge/${refrigeratorId}`,
          {},
          {
            ttl: CACHE_TTL.LONG,
            cacheKey: `fridge:${refrigeratorId}`,
            compareData: true,
          }
        );
        fridgeData = result.data;
      } else {
        const result = await getCachedAccess<any>(
          `fridge/${refrigeratorId}`,
          {},
          {
            ttl: CACHE_TTL.LONG,
            cacheKey: `fridge:${refrigeratorId}`,
            compareData: true,
          }
        );
        fridgeData = result.data;
      }
      setRefrigerator(fridgeData);

      // Fetch dishes and ingredients with caching - handle 404 as empty arrays
      let dishesData: any[] = [];
      let ingredientsData: any[] = [];
      
      try {
        let dishesResponse: any;
        if (isRefreshing) {
          const result = await refreshCachedAccess<any>(
            `fridge/${refrigeratorId}/dishes`,
            {},
            {
              ttl: CACHE_TTL.MEDIUM,
              cacheKey: `fridge:${refrigeratorId}:dishes`,
              compareData: true,
            }
          );
          dishesResponse = result.data;
        } else {
          const result = await getCachedAccess<any>(
            `fridge/${refrigeratorId}/dishes`,
            {},
            {
              ttl: CACHE_TTL.MEDIUM,
              cacheKey: `fridge:${refrigeratorId}:dishes`,
              compareData: true,
            }
          );
          dishesResponse = result.data;
        }
        
        // Backend trả về { success, message, data, pagination }
        if (dishesResponse?.data && Array.isArray(dishesResponse.data)) {
          dishesData = dishesResponse.data;
        } else if (Array.isArray(dishesResponse)) {
          dishesData = dishesResponse;
        } else {
          dishesData = [];
        }
      } catch (dishErr: any) {
        // 404 means no dishes yet - this is normal, not an error
        const is404NoDishes = dishErr?.response?.status === 404 && 
          (dishErr?.response?.data?.message?.includes('Không tìm thấy món ăn') ||
           dishErr?.response?.data?.message?.includes('not found'));
        if (!is404NoDishes) {
        }
        dishesData = [];
      }
      
      try {
        let ingredientsResponse: any;
        if (isRefreshing) {
          const result = await refreshCachedAccess<any>(
            `fridge/${refrigeratorId}/ingredients`,
            {},
            {
              ttl: CACHE_TTL.MEDIUM,
              cacheKey: `fridge:${refrigeratorId}:ingredients`,
              compareData: true,
            }
          );
          ingredientsResponse = result.data;
        } else {
          const result = await getCachedAccess<any>(
            `fridge/${refrigeratorId}/ingredients`,
            {},
            {
              ttl: CACHE_TTL.MEDIUM,
              cacheKey: `fridge:${refrigeratorId}:ingredients`,
              compareData: true,
            }
          );
          ingredientsResponse = result.data;
        }
        
        // Backend trả về { success, message, data, pagination }
        if (ingredientsResponse?.data && Array.isArray(ingredientsResponse.data)) {
          ingredientsData = ingredientsResponse.data;
        } else if (Array.isArray(ingredientsResponse)) {
          ingredientsData = ingredientsResponse;
        } else {
          ingredientsData = [];
        }
      } catch (ingredientErr: any) {
        // 404 means no ingredients yet - this is normal, not an error
        const is404NoIngredients = ingredientErr?.response?.status === 404 && 
          (ingredientErr?.response?.data?.message?.includes('Không tìm thấy nguyên liệu') ||
           ingredientErr?.response?.data?.message?.includes('not found'));
        if (!is404NoIngredients) {
        }
        ingredientsData = [];
      }

      setFridgeDishes(dishesData);
      setFridgeIngredients(ingredientsData);
    } catch (err: any) {
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        handleSessionExpired();
        return;
      }
      setError('Không thể tải thông tin tủ lạnh. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refrigeratorId, handleSessionExpired]);

  const fetchSuggestions = useCallback(async (showLoading = true) => {
    try {
      // Only show loading if we don't have suggestions yet
      if (showLoading && suggestions.length === 0) {
        setLoadingSuggestions(true);
      }
      setSuggestionsError(null);
      
      // Check cache first
      const cacheKey = `fridge:${refrigeratorId}:suggestions`;
      const cachedData = await getCache<any>(cacheKey);
      
      if (cachedData) {
        // Handle both cases: cache might have full API response or just the array
        const cachedSuggestions = cachedData?.data && Array.isArray(cachedData.data)
          ? cachedData.data
          : Array.isArray(cachedData)
            ? cachedData
            : [];
        
        if (cachedSuggestions.length > 0 || Array.isArray(cachedData)) {
          // We have cache, show it immediately without loading
          setSuggestions(cachedSuggestions);
          setLoadingSuggestions(false);
          
          // Fetch fresh data in background
          refreshCachedAccess<any>(
            `fridge/${refrigeratorId}/suggestions`,
            {},
            {
              ttl: CACHE_TTL.SHORT,
              cacheKey,
              compareData: true,
            }
          ).then((freshResult) => {
            if (freshResult.updated) {
              const freshSuggestions = freshResult.data?.data && Array.isArray(freshResult.data.data)
                ? freshResult.data.data
                : Array.isArray(freshResult.data)
                  ? freshResult.data
                  : [];
              setSuggestions(freshSuggestions);
            }
          }).catch(() => {
            // Silently fail background refresh
          });
          
          return;
        }
      }
      
      // No cache, fetch from API
      if (showLoading) {
        setLoadingSuggestions(true);
      }
      
      // Use cached API for suggestions
      const result = await getCachedAccess<any>(
        `fridge/${refrigeratorId}/suggestions`,
        {},
        {
          ttl: CACHE_TTL.SHORT, // Short TTL for suggestions as they change based on ingredients
          cacheKey,
          compareData: true,
        }
      );
      
      const suggestionsData = result.data?.data && Array.isArray(result.data.data)
        ? result.data.data
        : Array.isArray(result.data)
          ? result.data
          : [];
      setSuggestions(suggestionsData);
      
      // If we got data from cache, fetch fresh data in background
      if (result.fromCache) {
        refreshCachedAccess<any>(
          `fridge/${refrigeratorId}/suggestions`,
          {},
          {
            ttl: CACHE_TTL.SHORT,
            cacheKey,
            compareData: true,
          }
        ).then((freshResult) => {
          if (freshResult.updated) {
            const freshSuggestions = freshResult.data?.data && Array.isArray(freshResult.data.data)
              ? freshResult.data.data
              : Array.isArray(freshResult.data)
                ? freshResult.data
                : [];
            setSuggestions(freshSuggestions);
          }
        }).catch(() => {
          // Silently fail background refresh
        });
      }
    } catch (err: any) {
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
  }, [refrigeratorId, suggestions.length]);

  useEffect(() => {
    fetchRefrigeratorData();
  }, [fetchRefrigeratorData]);

  useFocusEffect(
    useCallback(() => {
      // Only refresh if we don't have data yet, otherwise skip refresh on focus
      // This prevents loading spinner from showing when switching tabs
      if (fridgeDishes.length === 0 && fridgeIngredients.length === 0) {
        fetchRefrigeratorData(false); // Don't show refreshing indicator
      }
      // If we have data, don't refresh on focus to avoid loading spinner
      
      if (activeTab === 'suggestions' && suggestions.length === 0) {
        fetchSuggestions(true);
      }
      // If we have suggestions, don't refresh on focus
    }, [fetchRefrigeratorData, activeTab, fetchSuggestions, fridgeDishes.length, fridgeIngredients.length, suggestions.length])
  );

  useEffect(() => {
    if (activeTab === 'suggestions') {
      // Only show loading if we don't have suggestions yet
      fetchSuggestions(suggestions.length === 0);
    }
  }, [activeTab, fetchSuggestions, suggestions.length]);

  // Real-time refrigerator updates
  const refrigeratorContext = useRefrigerator();

  // Join family room for real-time updates
  useEffect(() => {
    if (refrigerator?.family_id && refrigeratorContext.isConnected) {
      refrigeratorContext.joinFamily(refrigerator.family_id);
    }

    return () => {
      if (refrigerator?.family_id) {
        refrigeratorContext.leaveFamily(refrigerator.family_id);
      }
    };
  }, [refrigerator?.family_id, refrigeratorContext.isConnected]);

  // Listen to refrigerator events
  useEffect(() => {
    const unsubscribers: Array<() => void> = [];

    // Ingredient added
    unsubscribers.push(
      refrigeratorContext.onIngredientAdded((data) => {
        if (data.refrigeratorId === refrigeratorId) {
          setFridgeIngredients((prev) => [...prev, data.ingredient]);
        }
      })
    );

    // Ingredient updated
    unsubscribers.push(
      refrigeratorContext.onIngredientUpdated((data) => {
        if (data.refrigeratorId === refrigeratorId) {
          setFridgeIngredients((prev) =>
            prev.map((ing) =>
              Number(ing.id) === Number(data.ingredient?.id) ? data.ingredient : ing
            )
          );
        }
      })
    );

    // Ingredient deleted
    unsubscribers.push(
      refrigeratorContext.onIngredientDeleted((data) => {
        if (data.refrigeratorId === refrigeratorId) {
          setFridgeIngredients((prev) =>
            prev.filter((ing) => Number(ing.id) !== Number(data.ingredientId))
          );
        }
      })
    );

    // Dish added
    unsubscribers.push(
      refrigeratorContext.onDishAdded((data) => {
        if (data.refrigeratorId === refrigeratorId) {
          setFridgeDishes((prev) => [...prev, data.dish]);
        }
      })
    );

    // Dish updated
    unsubscribers.push(
      refrigeratorContext.onDishUpdated((data) => {
        if (data.refrigeratorId === refrigeratorId) {
          setFridgeDishes((prev) =>
            prev.map((dish) =>
              Number(dish.id) === Number(data.dish?.id) ? data.dish : dish
            )
          );
        }
      })
    );

    // Dish deleted
    unsubscribers.push(
      refrigeratorContext.onDishDeleted((data) => {
        if (data.refrigeratorId === refrigeratorId) {
          setFridgeDishes((prev) =>
            prev.filter((dish) => Number(dish.id) !== Number(data.dishId))
          );
        }
      })
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [refrigeratorId, refrigeratorContext]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(fridge)' as any);
    }
  };

  const handleAddDish = () => {
    setShowAddDishModal(true);
    setShowDishSelection(true);
    setSelectedDish(null);
    setDishStock('');
    setDishPrice('');
    setDishExpirationDate(null);
    setDishSearchQuery('');
  };

  const handleAddIngredient = () => {
    setShowAddIngredientModal(true);
    setShowIngredientSelection(true);
    setSelectedIngredient(null);
    setIngredientStock('');
    setIngredientPrice('');
    setIngredientExpirationDate(null);
    setIngredientSearchQuery('');
  };

  // Fetch dishes for modal
  const fetchDishes = useCallback(
    async (pageNumber = 1, reset = false) => {
      setLoadingDishes(true);
      try {
        const endpoint = dishSearchQuery.trim()
          ? `dishes/search-paginated?name=${encodeURIComponent(dishSearchQuery)}&page=${pageNumber}&limit=${PAGE_LIMIT}`
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
    [dishSearchQuery, handleSessionExpired],
  );

  // Fetch ingredients for modal
  const fetchIngredients = useCallback(
    async (pageNumber = 1, reset = false) => {
      setLoadingIngredients(true);
      try {
        const endpoint = ingredientSearchQuery.trim()
          ? `ingredients/search/name?name=${encodeURIComponent(ingredientSearchQuery)}&page=${pageNumber}&limit=${PAGE_LIMIT}`
          : `ingredients/paginated?page=${pageNumber}&limit=${PAGE_LIMIT}`;

        const payload = await getAccess(endpoint);

        if (!payload?.success && !Array.isArray(payload)) {
          throw new Error(payload?.message || 'Không thể tải danh sách nguyên liệu');
        }

        const newIngredients: Ingredient[] = Array.isArray(payload) ? payload : (payload.data || []);
        const pagination = payload.pagination || {};

        setIngredients(prev => (reset ? newIngredients : [...prev, ...newIngredients]));
        setHasNextIngredientPage(Boolean(pagination.hasNextPage));
        setIngredientPage(pagination.currentPage || pageNumber);
      } catch (err: any) {
        if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
          handleSessionExpired();
          return;
        }
      } finally {
        setLoadingIngredients(false);
      }
    },
    [ingredientSearchQuery, handleSessionExpired],
  );

  useEffect(() => {
    if (showAddDishModal && showDishSelection) {
      fetchDishes(1, true);
    }
  }, [showAddDishModal, showDishSelection, fetchDishes]);

  useEffect(() => {
    if (showAddIngredientModal && showIngredientSelection) {
      fetchIngredients(1, true);
    }
  }, [showAddIngredientModal, showIngredientSelection, fetchIngredients]);

  const handleSelectDish = (dish: Dish) => {
    setSelectedDish(dish);
    setShowDishSelection(false);
  };

  const handleSelectIngredient = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setShowIngredientSelection(false);
  };

  const handleSubmitDish = async () => {
    if (!selectedDish) {
      Alert.alert('Lỗi', 'Vui lòng chọn món ăn');
      return;
    }

    if (!dishStock.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số lượng');
      return;
    }

    const stockValue = parseInt(dishStock);
    if (isNaN(stockValue) || stockValue <= 0) {
      Alert.alert('Lỗi', 'Số lượng phải là số nguyên dương');
      return;
    }

    let priceValue: number | undefined = undefined;
    if (dishPrice.trim()) {
      const parsedPrice = parseFloat(dishPrice);
      if (!isNaN(parsedPrice) && parsedPrice >= 0) {
        priceValue = parsedPrice;
      } else {
        Alert.alert('Lỗi', 'Giá phải là số hợp lệ');
        return;
      }
    }

    const dishId = typeof selectedDish.id === 'string' ? parseInt(selectedDish.id) : Number(selectedDish.id);
    if (isNaN(dishId)) {
      Alert.alert('Lỗi', 'ID món ăn không hợp lệ');
      return;
    }

    // Create optimistic item with temporary negative ID
    const tempId = Date.now() * -1;
    const optimisticDish: FridgeDish = {
      id: tempId,
      refrigerator_id: refrigeratorId,
      dish_id: dishId,
      stock: stockValue,
      price: priceValue,
      expiration_date: dishExpirationDate ? dishExpirationDate.toISOString().split('T')[0] : null,
      note: dishNote.trim() || undefined,
      created_at: new Date().toISOString(),
      dish: {
        id: selectedDish.id,
        name: selectedDish.name,
        image_url: selectedDish.image_url,
        description: selectedDish.description,
      },
    };

    // Update local state IMMEDIATELY before closing modal (optimistic update)
    setFridgeDishes(prevDishes => [...prevDishes, optimisticDish]);

    // Close modal immediately for better UX
    setShowAddDishModal(false);

    // Reset form immediately
    setSelectedDish(null);
    setDishStock('');
    setDishPrice('');
    setDishExpirationDate(null);
    setDishNote('');
    setShowDishSelection(true);

    // Call API in background (don't await to keep UI responsive)
    addDishToRefrigerator(refrigeratorId, {
      dish_id: dishId,
      stock: stockValue,
      price: priceValue,
      expiration_date: dishExpirationDate ? dishExpirationDate.toISOString().split('T')[0] : undefined,
      note: dishNote.trim() || undefined,
    })
      .then((newDish) => {
        clearCacheByPattern(`fridge:${refrigeratorId}`).catch(() => {});

        if (newDish) {
          setFridgeDishes(prevDishes =>
            prevDishes.map(dish =>
              dish.id === tempId
                ? { ...newDish, dish: optimisticDish.dish }
                : dish
            )
          );
        }

        // Fetch fresh data from API after a delay to sync with server
        setTimeout(() => {
          fetchRefrigeratorData(true).catch(() => {
            // Silently fail, optimistic update is already shown
          });
        }, 2000);
      })
      .catch((error) => {
        // Rollback optimistic update on error
        setFridgeDishes(prevDishes =>
          prevDishes.filter(dish => dish.id !== tempId)
        );

        Alert.alert('Lỗi', 'Không thể thêm món ăn. Vui lòng thử lại.');
      });
  };

  const handleSubmitIngredient = async () => {
    if (!selectedIngredient) {
      Alert.alert('Lỗi', 'Vui lòng chọn nguyên liệu');
      return;
    }

    if (!ingredientStock.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số lượng');
      return;
    }

    const stockValue = parseInt(ingredientStock);
    if (isNaN(stockValue) || stockValue < 0) {
      Alert.alert('Lỗi', 'Số lượng phải là số nguyên không âm');
      return;
    }

    let priceValue: number | undefined = undefined;
    if (ingredientPrice.trim()) {
      const parsedPrice = parseFloat(ingredientPrice);
      if (!isNaN(parsedPrice) && parsedPrice >= 0) {
        priceValue = parsedPrice;
      } else {
        Alert.alert('Lỗi', 'Giá phải là số hợp lệ');
        return;
      }
    }

    const ingredientId = typeof selectedIngredient.id === 'string' ? parseInt(selectedIngredient.id) : Number(selectedIngredient.id);
    if (isNaN(ingredientId)) {
      Alert.alert('Lỗi', 'ID nguyên liệu không hợp lệ');
      return;
    }

    // Create optimistic item with temporary negative ID
    const tempId = Date.now() * -1;
    const optimisticIngredient: FridgeIngredient = {
      id: tempId,
      refrigerator_id: refrigeratorId,
      ingredient_id: ingredientId,
      stock: stockValue,
      price: priceValue,
      expiration_date: ingredientExpirationDate ? ingredientExpirationDate.toISOString().split('T')[0] : null,
      note: ingredientNote.trim() || undefined,
      created_at: new Date().toISOString(),
      ingredient: {
        id: selectedIngredient.id,
        name: selectedIngredient.name,
        image_url: selectedIngredient.image_url,
      },
    };

    // Update local state IMMEDIATELY before closing modal (optimistic update)
    setFridgeIngredients(prevIngredients => [...prevIngredients, optimisticIngredient]);

    // Close modal immediately for better UX
    setShowAddIngredientModal(false);

    // Reset form immediately
    setSelectedIngredient(null);
    setIngredientStock('');
    setIngredientPrice('');
    setIngredientExpirationDate(null);
    setIngredientNote('');
    setShowIngredientSelection(true);

    // Call API in background (don't await to keep UI responsive)
    addIngredientToRefrigerator(refrigeratorId, {
      ingredient_id: ingredientId,
      stock: stockValue,
      price: priceValue,
      expiration_date: ingredientExpirationDate ? ingredientExpirationDate.toISOString().split('T')[0] : undefined,
      note: ingredientNote.trim() || undefined,
    })
      .then((newIngredient) => {
        clearCacheByPattern(`fridge:${refrigeratorId}`).catch(() => {});

        if (newIngredient) {
          setFridgeIngredients(prevIngredients =>
            prevIngredients.map(ingredient =>
              ingredient.id === tempId
                ? { ...newIngredient, ingredient: optimisticIngredient.ingredient }
                : ingredient
            )
          );
        }

        // Fetch fresh data from API after a delay to sync with server
        setTimeout(() => {
          fetchRefrigeratorData(true).catch(() => {
            // Silently fail, optimistic update is already shown
          });
        }, 2000);
      })
      .catch((error) => {
        // Rollback optimistic update on error
        setFridgeIngredients(prevIngredients =>
          prevIngredients.filter(ingredient => ingredient.id !== tempId)
        );

        Alert.alert('Lỗi', 'Không thể thêm nguyên liệu. Vui lòng thử lại.');
      });
  };


  const handleDeleteDish = async (dishId: number) => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn xóa món ăn này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          // Optimistic UI: Xóa ngay khỏi state
          const deletedDish = fridgeDishes.find(d => d.id === dishId);
          setFridgeDishes(prev => prev.filter(d => d.id !== dishId));
          
          try {
            await removeFridgeDish(dishId);
            // Invalidate cache when removing dish
            await clearCacheByPattern(`fridge:${refrigeratorId}`);
            // Refresh data in background để đảm bảo sync
            fetchRefrigeratorData(true);
          } catch (err: any) {
            // Rollback nếu xóa thất bại
            if (deletedDish) {
              setFridgeDishes(prev => [...prev, deletedDish].sort((a, b) => {
                if (a.created_at && b.created_at) {
                  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                }
                return a.id - b.id;
              }));
            }
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
          // Optimistic UI: Xóa ngay khỏi state
          const deletedIngredient = fridgeIngredients.find(i => i.id === ingredientId);
          setFridgeIngredients(prev => prev.filter(i => i.id !== ingredientId));
          
          try {
            await removeFridgeIngredient(ingredientId);
            // Invalidate cache when removing ingredient
            await clearCacheByPattern(`fridge:${refrigeratorId}`);
            // Refresh data in background để đảm bảo sync
            fetchRefrigeratorData(true);
          } catch (err: any) {
            // Rollback nếu xóa thất bại
            if (deletedIngredient) {
              setFridgeIngredients(prev => [...prev, deletedIngredient].sort((a, b) => {
                if (a.created_at && b.created_at) {
                  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                }
                return a.id - b.id;
              }));
            }
            Alert.alert('Lỗi', 'Không thể xóa nguyên liệu. Vui lòng thử lại.');
          }
        },
      },
    ]);
  };

  const handleUpdateDish = async () => {
    if (!editingDish) return;

    if (!editDishStock.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số lượng');
      return;
    }

    const stockValue = parseInt(editDishStock);
    if (isNaN(stockValue) || stockValue <= 0) {
      Alert.alert('Lỗi', 'Số lượng phải là số nguyên dương');
      return;
    }

    let priceValue: number | undefined = undefined;
    if (editDishPrice.trim()) {
      const parsedPrice = parseFloat(editDishPrice);
      if (!isNaN(parsedPrice) && parsedPrice >= 0) {
        priceValue = parsedPrice;
      } else {
        Alert.alert('Lỗi', 'Giá phải là số hợp lệ');
        return;
      }
    }

    setUpdatingDish(true);
    try {
      // Optimistic update
      const originalDish = editingDish;
      setFridgeDishes(prevDishes =>
        prevDishes.map(dish =>
          dish.id === editingDish.id
            ? {
                ...dish,
                stock: stockValue,
                price: priceValue,
                expiration_date: editDishExpirationDate ? editDishExpirationDate.toISOString().split('T')[0] : null,
                note: editDishNote.trim() || undefined,
              }
            : dish
        )
      );

      // Close modal immediately
      setShowEditDishModal(false);
      setEditingDish(null);

      // Call API in background
      await updateFridgeDish(editingDish.id, {
        stock: stockValue,
        price: priceValue,
        expiration_date: editDishExpirationDate ? editDishExpirationDate.toISOString().split('T')[0] : undefined,
        note: editDishNote.trim() || undefined,
      });

      // Invalidate cache
      await clearCacheByPattern(`fridge:${refrigeratorId}`);

      // Fetch fresh data after a delay
      setTimeout(() => {
        fetchRefrigeratorData(true).catch(() => {});
      }, 2000);
    } catch (err: any) {
      // Rollback on error
      if (editingDish) {
        setFridgeDishes(prevDishes =>
          prevDishes.map(dish =>
            dish.id === editingDish.id ? editingDish : dish
          )
        );
      }

      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        handleSessionExpired();
        return;
      }
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể cập nhật món ăn. Vui lòng thử lại.';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setUpdatingDish(false);
    }
  };

  const handleUpdateIngredient = async () => {
    if (!editingIngredient) return;

    if (!editIngredientStock.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số lượng');
      return;
    }

    const stockValue = parseInt(editIngredientStock);
    if (isNaN(stockValue) || stockValue < 0) {
      Alert.alert('Lỗi', 'Số lượng phải là số nguyên không âm');
      return;
    }

    let priceValue: number | undefined = undefined;
    if (editIngredientPrice.trim()) {
      const parsedPrice = parseFloat(editIngredientPrice);
      if (!isNaN(parsedPrice) && parsedPrice >= 0) {
        priceValue = parsedPrice;
      } else {
        Alert.alert('Lỗi', 'Giá phải là số hợp lệ');
        return;
      }
    }

    setUpdatingIngredient(true);
    try {
      // Optimistic update
      setFridgeIngredients(prevIngredients =>
        prevIngredients.map(ingredient =>
          ingredient.id === editingIngredient.id
            ? {
                ...ingredient,
                stock: stockValue,
                price: priceValue,
                expiration_date: editIngredientExpirationDate ? editIngredientExpirationDate.toISOString().split('T')[0] : null,
                note: editIngredientNote.trim() || undefined,
              }
            : ingredient
        )
      );

      // Close modal immediately
      setShowEditIngredientModal(false);
      setEditingIngredient(null);

      // Call API in background
      await updateFridgeIngredient(editingIngredient.id, {
        stock: stockValue,
        price: priceValue,
        expiration_date: editIngredientExpirationDate ? editIngredientExpirationDate.toISOString().split('T')[0] : undefined,
        note: editIngredientNote.trim() || undefined,
      });

      // Invalidate cache
      await clearCacheByPattern(`fridge:${refrigeratorId}`);

      // Fetch fresh data after a delay
      setTimeout(() => {
        fetchRefrigeratorData(true).catch(() => {});
      }, 2000);
    } catch (err: any) {
      // Rollback on error
      if (editingIngredient) {
        setFridgeIngredients(prevIngredients =>
          prevIngredients.map(ingredient =>
            ingredient.id === editingIngredient.id ? editingIngredient : ingredient
          )
        );
      }

      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        handleSessionExpired();
        return;
      }
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể cập nhật nguyên liệu. Vui lòng thử lại.';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setUpdatingIngredient(false);
    }
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
              // Invalidate cache when deleting refrigerator
              await clearCacheByPattern('fridge:');
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
        {item.price !== undefined && item.price !== null && (
          <Text style={{ fontSize: 14, color: COLORS.grey, marginTop: 2 }}>
            Giá: {typeof item.price === 'number' ? item.price.toLocaleString('vi-VN') : Number(item.price).toLocaleString('vi-VN')} đ
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
        {item.note && (
          <Text style={{ fontSize: 13, color: COLORS.grey, marginTop: 4, fontStyle: 'italic' }}>
            📝 {item.note}
          </Text>
        )}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TouchableOpacity
          onPress={() => {
            setEditingDish(item);
            setEditDishStock(item.stock?.toString() || '');
            setEditDishPrice(item.price?.toString() || '');
            setEditDishExpirationDate(item.expiration_date ? new Date(item.expiration_date) : null);
            setEditDishNote(item.note || '');
            setShowEditDishModal(true);
          }}
          style={{ padding: 8 }}
        >
          <Ionicons name="create-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeleteDish(item.id)}
          style={{ padding: 8 }}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.red || '#EF4444'} />
        </TouchableOpacity>
      </View>
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
        {item.price !== undefined && item.price !== null && (
          <Text style={{ fontSize: 14, color: COLORS.grey, marginTop: 2 }}>
            Giá: {typeof item.price === 'number' ? item.price.toLocaleString('vi-VN') : Number(item.price).toLocaleString('vi-VN')} đ
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
        {item.note && (
          <Text style={{ fontSize: 13, color: COLORS.grey, marginTop: 4, fontStyle: 'italic' }}>
            📝 {item.note}
          </Text>
        )}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TouchableOpacity
          onPress={() => {
            setEditingIngredient(item);
            setEditIngredientStock(item.stock?.toString() || '');
            setEditIngredientPrice(item.price?.toString() || '');
            setEditIngredientExpirationDate(item.expiration_date ? new Date(item.expiration_date) : null);
            setEditIngredientNote(item.note || '');
            setShowEditIngredientModal(true);
          }}
          style={{ padding: 8 }}
        >
          <Ionicons name="create-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeleteIngredient(item.id)}
          style={{ padding: 8 }}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.red || '#EF4444'} />
        </TouchableOpacity>
      </View>
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
          {fridgeDishes.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Ionicons name="restaurant-outline" size={64} color={COLORS.grey} />
              <Text style={{ marginTop: 16, fontSize: 16, color: COLORS.grey }}>
                Chưa có món ăn nào
              </Text>
            </View>
          ) : (
            <FlatList
              data={[...fridgeDishes].sort((a, b) => {
                // Sort by created_at: oldest first (top), newest last (bottom)
                // If no created_at, use id as fallback (id increases over time)
                if (a.created_at && b.created_at) {
                  const dateA = new Date(a.created_at).getTime();
                  const dateB = new Date(b.created_at).getTime();
                  return dateA - dateB; // Ascending: older items first
                }
                // Fallback to id if created_at is missing
                return a.id - b.id; // Ascending: older items (lower id) first
              })}
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
          {fridgeIngredients.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Ionicons name="leaf-outline" size={64} color={COLORS.grey} />
              <Text style={{ marginTop: 16, fontSize: 16, color: COLORS.grey }}>
                Chưa có nguyên liệu nào
              </Text>
            </View>
          ) : (
            <FlatList
              data={[...fridgeIngredients].sort((a, b) => {
                // Sort by created_at: oldest first (top), newest last (bottom)
                // If no created_at, use id as fallback (id increases over time)
                if (a.created_at && b.created_at) {
                  const dateA = new Date(a.created_at).getTime();
                  const dateB = new Date(b.created_at).getTime();
                  return dateA - dateB; // Ascending: older items first
                }
                // Fallback to id if created_at is missing
                return a.id - b.id; // Ascending: older items (lower id) first
              })}
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
          {loadingSuggestions && suggestions.length === 0 ? (
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
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 8,
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
          {refrigerator?.family_id && refrigerator?.family?.name
            ? refrigerator.family.name
            : (refrigerator?.name || 'Tủ lạnh Cá nhân')}
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
              refreshing={refreshing && (fridgeDishes.length === 0 && fridgeIngredients.length === 0)}
              onRefresh={() => {
                // Only show refreshing indicator if we don't have data
                if (fridgeDishes.length === 0 && fridgeIngredients.length === 0) {
                  fetchRefrigeratorData(true);
                } else {
                  // Silently refresh in background
                  fetchRefrigeratorData(true).catch(() => {});
                }
              }}
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

      {/* Modal thêm món ăn */}
      <Modal visible={showAddDishModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' }}>
              {showDishSelection ? (
                <>
                  <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.darkGrey }}>Chọn món ăn</Text>
                      <TouchableOpacity onPress={() => {
                        setShowAddDishModal(false);
                        setDishSearchQuery('');
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
                      value={dishSearchQuery}
                      onChangeText={text => {
                        setDishSearchQuery(text);
                        fetchDishes(1, true);
                      }}
                    />
                  </View>
                  <FlatList
                    data={dishes}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => {
                      const existingDishIds = fridgeDishes.map(d => d.dish_id).filter(Boolean);
                      const isExisting = existingDishIds.includes(item.id);
                      return (
                        <TouchableOpacity
                          onPress={() => handleSelectDish(item)}
                          disabled={isExisting}
                          style={{
                            padding: 12,
                            borderBottomWidth: 1,
                            borderBottomColor: '#F0F0F0',
                            flexDirection: 'row',
                            gap: 12,
                            opacity: isExisting ? 0.5 : 1,
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
                            {isExisting && (
                              <Text style={{ fontSize: 12, color: COLORS.primary, marginTop: 4 }}>
                                Đã có trong tủ lạnh
                              </Text>
                            )}
                          </View>
                          {isExisting && <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />}
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
                </>
              ) : (
                <KeyboardAwareScrollView 
                  style={{ maxHeight: '90%' }} 
                  contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                  showsVerticalScrollIndicator={true}
                  enableOnAndroid={true}
                  enableAutomaticScroll={true}
                  extraScrollHeight={100}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="interactive"
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.darkGrey }}>Thông tin món ăn</Text>
                    <TouchableOpacity onPress={() => {
                      setShowAddDishModal(false);
                      setSelectedDish(null);
                      setDishStock('');
                      setDishPrice('');
                      setDishExpirationDate(null);
                      setDishNote('');
                    }}>
                      <Ionicons name="close" size={24} color={COLORS.darkGrey} />
                    </TouchableOpacity>
                  </View>

                  {selectedDish && (
                    <View style={{ backgroundColor: '#E0F2FE', borderRadius: 12, padding: 12, marginBottom: 16, flexDirection: 'row', gap: 12 }}>
                      {selectedDish.image_url ? (
                        <Image
                          source={{ uri: selectedDish.image_url }}
                          style={{ width: 80, height: 80, borderRadius: 8 }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={{
                            width: 80,
                            height: 80,
                            borderRadius: 8,
                            backgroundColor: '#E8EAF6',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <Ionicons name="restaurant-outline" size={32} color={COLORS.grey} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary, marginBottom: 4 }}>
                          Món ăn đã chọn
                        </Text>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.darkGrey }}>
                          {selectedDish.name}
                        </Text>
                        {selectedDish.description && (
                          <Text style={{ fontSize: 12, color: COLORS.grey, marginTop: 4 }} numberOfLines={2}>
                            {selectedDish.description}
                          </Text>
                        )}
                        <TouchableOpacity
                          onPress={() => setShowDishSelection(true)}
                          style={{ marginTop: 8 }}
                        >
                          <Text style={{ color: COLORS.primary, fontSize: 14 }}>Chọn lại món ăn</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.darkGrey, marginBottom: 8 }}>
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
                      value={dishStock}
                      onChangeText={setDishStock}
                      keyboardType="numeric"
                      placeholderTextColor={COLORS.grey}
                    />
                  </View>

                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.darkGrey, marginBottom: 8 }}>
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
                      value={dishPrice}
                      onChangeText={setDishPrice}
                      keyboardType="numeric"
                      placeholderTextColor={COLORS.grey}
                    />
                  </View>

                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.darkGrey, marginBottom: 8 }}>
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
                      onPress={() => setShowDishDatePicker(true)}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          color: dishExpirationDate ? COLORS.darkGrey : COLORS.grey,
                        }}
                      >
                        {dishExpirationDate
                          ? dishExpirationDate.toLocaleDateString('vi-VN')
                          : 'Chọn ngày hết hạn'}
                      </Text>
                      <Ionicons name="calendar-outline" size={20} color={COLORS.grey} />
                    </TouchableOpacity>
                    {dishExpirationDate && (
                      <TouchableOpacity
                        onPress={() => setDishExpirationDate(null)}
                        style={{ marginTop: 8, alignSelf: 'flex-start' }}
                      >
                        <Text style={{ color: COLORS.red || '#EF4444', fontSize: 14 }}>
                          Xóa ngày hết hạn
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {showDishDatePicker && (
                    <DateTimePicker
                      value={dishExpirationDate || new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      minimumDate={new Date()}
                      onChange={(event, selectedDate) => {
                        setShowDishDatePicker(Platform.OS === 'ios');
                        if (event.type === 'set' && selectedDate) {
                          setDishExpirationDate(selectedDate);
                        }
                      }}
                    />
                  )}

                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.darkGrey, marginBottom: 8 }}>
                      Ghi chú (tùy chọn)
                    </Text>
                    <TextInput
                      style={{
                        backgroundColor: COLORS.white,
                        borderRadius: 12,
                        padding: 16,
                        fontSize: 16,
                        borderWidth: 1,
                        borderColor: COLORS.background || '#E5E5E5',
                        minHeight: 80,
                        textAlignVertical: 'top',
                      }}
                      placeholder="Nhập ghi chú..."
                      value={dishNote}
                      onChangeText={setDishNote}
                      multiline
                      numberOfLines={3}
                      placeholderTextColor={COLORS.grey}
                    />
                  </View>

                  <TouchableOpacity
                    style={{
                      backgroundColor: COLORS.primary,
                      borderRadius: 12,
                      padding: 16,
                      alignItems: 'center',
                      marginTop: 8,
                    }}
                    onPress={handleSubmitDish}
                    disabled={addingDish}
                  >
                    {addingDish ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.white }}>
                        Thêm vào tủ lạnh
                      </Text>
                    )}
                  </TouchableOpacity>
                </KeyboardAwareScrollView>
              )}
            </View>
        </View>
      </Modal>

      {/* Modal thêm nguyên liệu */}
      <Modal visible={showAddIngredientModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' }}>
              {showIngredientSelection ? (
                <>
                  <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.darkGrey }}>Chọn nguyên liệu</Text>
                      <TouchableOpacity onPress={() => {
                        setShowAddIngredientModal(false);
                        setIngredientSearchQuery('');
                        setIngredients([]);
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
                      placeholder="Tìm kiếm nguyên liệu..."
                      placeholderTextColor={COLORS.grey}
                      value={ingredientSearchQuery}
                      onChangeText={text => {
                        setIngredientSearchQuery(text);
                        fetchIngredients(1, true);
                      }}
                    />
                  </View>
                  <FlatList
                    data={ingredients}
                    keyExtractor={item => item.id?.toString() || Math.random().toString()}
                    renderItem={({ item }) => {
                      const existingIngredientIds = fridgeIngredients.map(i => i.ingredient_id).filter(Boolean);
                      const isExisting = existingIngredientIds.includes(item.id);
                      return (
                        <TouchableOpacity
                          onPress={() => handleSelectIngredient(item)}
                          disabled={isExisting}
                          style={{
                            padding: 12,
                            borderBottomWidth: 1,
                            borderBottomColor: '#F0F0F0',
                            flexDirection: 'row',
                            gap: 12,
                            opacity: isExisting ? 0.5 : 1,
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
                                backgroundColor: '#E8F5E9',
                                justifyContent: 'center',
                                alignItems: 'center',
                              }}
                            >
                              <Ionicons name="leaf-outline" size={24} color={COLORS.grey} />
                            </View>
                          )}
                          <View style={{ flex: 1, justifyContent: 'center' }}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.darkGrey }}>
                              {item.name}
                            </Text>
                            {item.category && (
                              <Text style={{ fontSize: 12, color: COLORS.grey, marginTop: 4 }}>
                                {item.category.name}
                              </Text>
                            )}
                            {isExisting && (
                              <Text style={{ fontSize: 12, color: COLORS.primary, marginTop: 4 }}>
                                Đã có trong tủ lạnh
                              </Text>
                            )}
                          </View>
                          {isExisting && <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />}
                        </TouchableOpacity>
                      );
                    }}
                    ListFooterComponent={
                      hasNextIngredientPage ? (
                        <TouchableOpacity
                          onPress={() => fetchIngredients(ingredientPage + 1, false)}
                          disabled={loadingIngredients}
                          style={{ padding: 16, alignItems: 'center' }}
                        >
                          {loadingIngredients ? (
                            <ActivityIndicator size="small" color={COLORS.primary} />
                          ) : (
                            <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Tải thêm</Text>
                          )}
                        </TouchableOpacity>
                      ) : null
                    }
                    ListEmptyComponent={
                      !loadingIngredients ? (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                          <Text style={{ color: COLORS.grey }}>Không tìm thấy nguyên liệu nào</Text>
                        </View>
                      ) : null
                    }
                  />
                  {loadingIngredients && ingredients.length === 0 && (
                    <View style={{ padding: 40, alignItems: 'center' }}>
                      <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                  )}
                </>
              ) : (
                <KeyboardAwareScrollView 
                  style={{ maxHeight: '90%' }} 
                  contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                  showsVerticalScrollIndicator={true}
                  enableOnAndroid={true}
                  enableAutomaticScroll={true}
                  extraScrollHeight={100}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="interactive"
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.darkGrey }}>Thông tin nguyên liệu</Text>
                    <TouchableOpacity onPress={() => {
                      setShowAddIngredientModal(false);
                      setSelectedIngredient(null);
                      setIngredientStock('');
                      setIngredientPrice('');
                      setIngredientExpirationDate(null);
                      setIngredientNote('');
                    }}>
                      <Ionicons name="close" size={24} color={COLORS.darkGrey} />
                    </TouchableOpacity>
                  </View>

                  {selectedIngredient && (
                    <View style={{ backgroundColor: '#E0F2FE', borderRadius: 12, padding: 12, marginBottom: 16, flexDirection: 'row', gap: 12 }}>
                      {selectedIngredient.image_url ? (
                        <Image
                          source={{ uri: selectedIngredient.image_url }}
                          style={{ width: 80, height: 80, borderRadius: 8 }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={{
                            width: 80,
                            height: 80,
                            borderRadius: 8,
                            backgroundColor: '#E8F5E9',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <Ionicons name="leaf-outline" size={32} color={COLORS.grey} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.primary, marginBottom: 4 }}>
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
                        <TouchableOpacity
                          onPress={() => setShowIngredientSelection(true)}
                          style={{ marginTop: 8 }}
                        >
                          <Text style={{ color: COLORS.primary, fontSize: 14 }}>Chọn lại nguyên liệu</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.darkGrey, marginBottom: 8 }}>
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
                      value={ingredientStock}
                      onChangeText={setIngredientStock}
                      keyboardType="numeric"
                      placeholderTextColor={COLORS.grey}
                    />
                  </View>

                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.darkGrey, marginBottom: 8 }}>
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
                      value={ingredientPrice}
                      onChangeText={setIngredientPrice}
                      keyboardType="numeric"
                      placeholderTextColor={COLORS.grey}
                    />
                  </View>

                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.darkGrey, marginBottom: 8 }}>
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
                      onPress={() => setShowIngredientDatePicker(true)}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          color: ingredientExpirationDate ? COLORS.darkGrey : COLORS.grey,
                        }}
                      >
                        {ingredientExpirationDate
                          ? ingredientExpirationDate.toLocaleDateString('vi-VN')
                          : 'Chọn ngày hết hạn'}
                      </Text>
                      <Ionicons name="calendar-outline" size={20} color={COLORS.grey} />
                    </TouchableOpacity>
                    {ingredientExpirationDate && (
                      <TouchableOpacity
                        onPress={() => setIngredientExpirationDate(null)}
                        style={{ marginTop: 8, alignSelf: 'flex-start' }}
                      >
                        <Text style={{ color: COLORS.red || '#EF4444', fontSize: 14 }}>
                          Xóa ngày hết hạn
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                    {showIngredientDatePicker && (
                      <DateTimePicker
                        value={ingredientExpirationDate || new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        minimumDate={new Date()}
                        onChange={(event, selectedDate) => {
                          setShowIngredientDatePicker(Platform.OS === 'ios');
                          if (event.type === 'set' && selectedDate) {
                            setIngredientExpirationDate(selectedDate);
                          }
                        }}
                      />
                    )}

                    <View style={{ marginBottom: 16 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.darkGrey, marginBottom: 8 }}>
                        Ghi chú (tùy chọn)
                      </Text>
                      <TextInput
                        style={{
                          backgroundColor: COLORS.white,
                          borderRadius: 12,
                          padding: 16,
                          fontSize: 16,
                          borderWidth: 1,
                          borderColor: COLORS.background || '#E5E5E5',
                          minHeight: 80,
                          textAlignVertical: 'top',
                        }}
                        placeholder="Nhập ghi chú..."
                        value={ingredientNote}
                        onChangeText={setIngredientNote}
                        multiline
                        numberOfLines={3}
                        placeholderTextColor={COLORS.grey}
                      />
                    </View>

                    <TouchableOpacity
                      style={{
                        backgroundColor: COLORS.primary,
                        borderRadius: 12,
                        padding: 16,
                        alignItems: 'center',
                        marginTop: 8,
                      }}
                      onPress={handleSubmitIngredient}
                      disabled={addingIngredient}
                    >
                    {addingIngredient ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.white }}>
                        Thêm vào tủ lạnh
                      </Text>
                    )}
                  </TouchableOpacity>
                </KeyboardAwareScrollView>
              )}
            </View>
        </View>
      </Modal>

      {/* Edit Dish Modal */}
      <Modal visible={showEditDishModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' }}>
            <KeyboardAwareScrollView 
              style={{ maxHeight: '90%' }} 
              contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
              showsVerticalScrollIndicator={true}
              enableOnAndroid={true}
              extraScrollHeight={20}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.darkGrey }}>Chỉnh sửa món ăn</Text>
                <TouchableOpacity onPress={() => {
                  setShowEditDishModal(false);
                  setEditingDish(null);
                  setEditDishNote('');
                }}>
                  <Ionicons name="close" size={24} color={COLORS.darkGrey} />
                </TouchableOpacity>
              </View>

              {editingDish && editingDish.dish && (
                <View style={{ backgroundColor: '#E0F2FE', borderRadius: 12, padding: 12, marginBottom: 16, flexDirection: 'row', gap: 12 }}>
                  {editingDish.dish.image_url ? (
                    <Image
                      source={{ uri: editingDish.dish.image_url }}
                      style={{ width: 80, height: 80, borderRadius: 8 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 8,
                        backgroundColor: '#E8EAF6',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons name="restaurant-outline" size={32} color={COLORS.grey} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.darkGrey }}>
                      {editingDish.dish.name}
                    </Text>
                  </View>
                </View>
              )}

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.darkGrey, marginBottom: 8 }}>
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
                  value={editDishStock}
                  onChangeText={setEditDishStock}
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.grey}
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.darkGrey, marginBottom: 8 }}>
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
                  value={editDishPrice}
                  onChangeText={setEditDishPrice}
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.grey}
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.darkGrey, marginBottom: 8 }}>
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
                  onPress={() => setShowEditDishDatePicker(true)}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: editDishExpirationDate ? COLORS.darkGrey : COLORS.grey,
                    }}
                  >
                    {editDishExpirationDate
                      ? editDishExpirationDate.toLocaleDateString('vi-VN')
                      : 'Chọn ngày hết hạn'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color={COLORS.grey} />
                </TouchableOpacity>
                {editDishExpirationDate && (
                  <TouchableOpacity
                    onPress={() => setEditDishExpirationDate(null)}
                    style={{ marginTop: 8, alignSelf: 'flex-start' }}
                  >
                    <Text style={{ color: COLORS.red || '#EF4444', fontSize: 14 }}>
                      Xóa ngày hết hạn
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {showEditDishDatePicker && (
                <DateTimePicker
                  value={editDishExpirationDate || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowEditDishDatePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setEditDishExpirationDate(selectedDate);
                    }
                  }}
                />
              )}

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.darkGrey, marginBottom: 8 }}>
                  Ghi chú (tùy chọn)
                </Text>
                <TextInput
                  style={{
                    backgroundColor: COLORS.white,
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: COLORS.background || '#E5E5E5',
                    minHeight: 80,
                    textAlignVertical: 'top',
                  }}
                  placeholder="Nhập ghi chú..."
                  value={editDishNote}
                  onChangeText={setEditDishNote}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={COLORS.grey}
                />
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: COLORS.primary,
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center',
                  marginTop: 16,
                }}
                onPress={handleUpdateDish}
                disabled={updatingDish}
              >
                {updatingDish ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.white }}>
                    Cập nhật
                  </Text>
                )}
              </TouchableOpacity>
            </KeyboardAwareScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Ingredient Modal */}
      <Modal visible={showEditIngredientModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' }}>
            <KeyboardAwareScrollView 
              style={{ maxHeight: '90%' }} 
              contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
              showsVerticalScrollIndicator={true}
              enableOnAndroid={true}
              extraScrollHeight={20}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.darkGrey }}>Chỉnh sửa nguyên liệu</Text>
                <TouchableOpacity onPress={() => {
                  setShowEditIngredientModal(false);
                  setEditingIngredient(null);
                  setEditIngredientNote('');
                }}>
                  <Ionicons name="close" size={24} color={COLORS.darkGrey} />
                </TouchableOpacity>
              </View>

              {editingIngredient && editingIngredient.ingredient && (
                <View style={{ backgroundColor: '#E0F2FE', borderRadius: 12, padding: 12, marginBottom: 16, flexDirection: 'row', gap: 12 }}>
                  {editingIngredient.ingredient.image_url ? (
                    <Image
                      source={{ uri: editingIngredient.ingredient.image_url }}
                      style={{ width: 80, height: 80, borderRadius: 8 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 8,
                        backgroundColor: '#E8F5E9',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons name="leaf-outline" size={32} color={COLORS.grey} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.darkGrey }}>
                      {editingIngredient.ingredient.name}
                    </Text>
                  </View>
                </View>
              )}

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.darkGrey, marginBottom: 8 }}>
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
                  value={editIngredientStock}
                  onChangeText={setEditIngredientStock}
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.grey}
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.darkGrey, marginBottom: 8 }}>
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
                  value={editIngredientPrice}
                  onChangeText={setEditIngredientPrice}
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.grey}
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.darkGrey, marginBottom: 8 }}>
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
                  onPress={() => setShowEditIngredientDatePicker(true)}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: editIngredientExpirationDate ? COLORS.darkGrey : COLORS.grey,
                    }}
                  >
                    {editIngredientExpirationDate
                      ? editIngredientExpirationDate.toLocaleDateString('vi-VN')
                      : 'Chọn ngày hết hạn'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color={COLORS.grey} />
                </TouchableOpacity>
                {editIngredientExpirationDate && (
                  <TouchableOpacity
                    onPress={() => setEditIngredientExpirationDate(null)}
                    style={{ marginTop: 8, alignSelf: 'flex-start' }}
                  >
                    <Text style={{ color: COLORS.red || '#EF4444', fontSize: 14 }}>
                      Xóa ngày hết hạn
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {showEditIngredientDatePicker && (
                <DateTimePicker
                  value={editIngredientExpirationDate || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowEditIngredientDatePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setEditIngredientExpirationDate(selectedDate);
                    }
                  }}
                />
              )}

              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.darkGrey, marginBottom: 8 }}>
                  Ghi chú (tùy chọn)
                </Text>
                <TextInput
                  style={{
                    backgroundColor: COLORS.white,
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: COLORS.background || '#E5E5E5',
                    minHeight: 80,
                    textAlignVertical: 'top',
                  }}
                  placeholder="Nhập ghi chú..."
                  value={editIngredientNote}
                  onChangeText={setEditIngredientNote}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={COLORS.grey}
                />
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: COLORS.primary,
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center',
                  marginTop: 16,
                }}
                onPress={handleUpdateIngredient}
                disabled={updatingIngredient}
              >
                {updatingIngredient ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.white }}>
                    Cập nhật
                  </Text>
                )}
              </TouchableOpacity>
            </KeyboardAwareScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
