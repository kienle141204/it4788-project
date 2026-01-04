import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, TextInput, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../constants/themes';
import { foodStyles } from '../../styles/food.styles';
import FoodCard from '../../components/FoodCard';
import { getAccess } from '../../utils/api';

interface Dish {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  created_at: string;
}

const PAGE_LIMIT = 10;

export default function FoodPage() {
  const router = useRouter();
  const sessionExpiredRef = useRef(false);
  const [activeTab, setActiveTab] = useState<'explore' | 'mine'>('explore');
  const [searchQuery, setSearchQuery] = useState('');
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Favorite dishes state
  const [favoriteDishes, setFavoriteDishes] = useState<Dish[]>([]);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home' as any);
    }
  };

  const handleNotificationPress = () => {
    // Handle notification press
  };

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

  const fetchDishes = useCallback(async (pageNumber = 1, reset = false) => {
    const query = searchQuery.trim();
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const endpoint = query
        ? `dishes/search-paginated?name=${encodeURIComponent(query)}&page=${pageNumber}&limit=${PAGE_LIMIT}`
        : `dishes/get-paginated?page=${pageNumber}&limit=${PAGE_LIMIT}`;

      const payload = await getAccess(endpoint);

      if (!payload?.success) {
        throw new Error(payload?.message || 'Không thể tải danh sách món ăn');
      }

      const newItems: Dish[] = payload.data || [];
      // Pagination có thể nằm ở payload.pagination hoặc payload.details.pagination
      const pagination = payload.pagination || payload.details?.pagination || {};

      setDishes(prev => (reset ? newItems : [...prev, ...newItems]));
      setHasNextPage(Boolean(pagination.hasNextPage));
      setPage(pagination.currentPage || pageNumber);
      setError(null);
    } catch (err: any) {
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        handleSessionExpired();
        return;
      }
      setError('Không thể tải danh sách món ăn. Vui lòng thử lại.');
      if (reset) {
        setDishes([]);
      }
    } finally {
      if (reset) {
        setLoading(false);
        setRefreshing(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, [searchQuery, handleSessionExpired]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchDishes(1, true);
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [fetchDishes]);

  const handleFoodPress = (id: string) => {
    router.push(`/(food)/${id}` as any);
  };

  const handleLoadMore = () => {
    if (loadingMore || !hasNextPage) return;
    fetchDishes(page + 1, false);
  };

  const handleRefresh = () => {
    if (activeTab === 'explore') {
      setRefreshing(true);
      fetchDishes(1, true);
    } else {
      setRefreshing(true);
      fetchFavoriteDishes(true);
    }
  };

  const fetchFavoriteDishes = useCallback(async (silent = false) => {
    if (!silent) {
      setFavoriteLoading(true);
    }
    setFavoriteError(null);

    try {
      const payload = await getAccess('favorite-dishes');

      if (payload?.success !== false && payload?.data) {
        // Transform favorite dishes data: extract dish objects from favorite items
        const dishesList: Dish[] = payload.data
          .map((item: any) => {
            if (item.dish) {
              return {
                id: String(item.dish.id || item.dish_id),
                name: item.dish.name || '',
                description: item.dish.description || '',
                image_url: item.dish.image_url || null,
                created_at: item.dish.created_at || item.created_at,
              };
            }
            return null;
          })
          .filter((dish: Dish | null) => dish !== null) as Dish[];

        setFavoriteDishes(dishesList);
      } else {
        throw new Error(payload?.message || 'Không thể tải danh sách món ăn yêu thích');
      }
    } catch (err: any) {
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        handleSessionExpired();
        return;
      }
      setFavoriteError('Không thể tải danh sách món ăn yêu thích. Vui lòng thử lại.');
      setFavoriteDishes([]);
    } finally {
      if (!silent) {
        setFavoriteLoading(false);
      }
      setRefreshing(false);
    }
  }, [handleSessionExpired]);

  // Fetch favorite dishes when switching to "mine" tab
  useEffect(() => {
    if (activeTab === 'mine') {
      fetchFavoriteDishes();
    }
  }, [activeTab, fetchFavoriteDishes]);

  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} translucent={false} />
      <SafeAreaView style={[foodStyles.container, { backgroundColor: COLORS.background }]} edges={['top']}>

      {/* Header */}
      <View style={[foodStyles.header, { paddingTop: 10, backgroundColor: COLORS.background }]}>
        <TouchableOpacity onPress={handleBack} style={foodStyles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.darkGrey} />
        </TouchableOpacity>

        <Text style={foodStyles.headerTitle}>Món ăn</Text>

        <TouchableOpacity
          onPress={handleNotificationPress}
          style={foodStyles.notificationButton}
        >
          {/* <Ionicons name="notifications-outline" size={24} color={COLORS.darkGrey} />
          <View style={foodStyles.notificationDot} /> */}
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={foodStyles.tabContainer}>
        <TouchableOpacity
          style={[
            foodStyles.tab,
            activeTab === 'explore' ? foodStyles.tabActive : foodStyles.tabInactive
          ]}
          onPress={() => setActiveTab('explore')}
        >
          <Text
            style={[
              activeTab === 'explore' ? foodStyles.tabTextActive : foodStyles.tabTextInactive
            ]}
          >
            Khám phá
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            foodStyles.tab,
            activeTab === 'mine' ? foodStyles.tabActive : foodStyles.tabInactive
          ]}
          onPress={() => setActiveTab('mine')}
        >
          <Text
            style={[
              activeTab === 'mine' ? foodStyles.tabTextActive : foodStyles.tabTextInactive
            ]}
          >
            Của tôi
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar - Only show when tab is "explore" */}
      {activeTab === 'explore' && (
        <View style={foodStyles.searchContainer}>
          <View style={foodStyles.searchBar}>
            <Ionicons name="search" size={20} color={COLORS.darkGrey} style={foodStyles.searchIcon} />
            <TextInput
              style={foodStyles.searchInput}
              placeholder="Tìm kiếm món ăn"
              placeholderTextColor={COLORS.darkGrey}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      )}

      {/* Content */}
      {((activeTab === 'explore' && loading && dishes.length === 0) ||
        (activeTab === 'mine' && favoriteLoading && favoriteDishes.length === 0)) ? (
        <View style={foodStyles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.purple} />
          <Text style={foodStyles.loaderText}>
            {activeTab === 'explore' ? 'Đang tải món ăn...' : 'Đang tải món ăn yêu thích...'}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={foodStyles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={foodStyles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.purple} />
          }
        >
          {activeTab === 'explore' && (
            <>
              {error && (
                <View style={foodStyles.errorContainer}>
                  <Ionicons name="alert-circle-outline" size={20} color={COLORS.purple} />
                  <Text style={foodStyles.errorText}>{error}</Text>
                </View>
              )}

              {!error && dishes.length === 0 && (
                <View style={foodStyles.emptyState}>
                  <Text style={foodStyles.emptyStateText}>
                    Không tìm thấy món ăn nào
                  </Text>
                </View>
              )}

              <View style={foodStyles.foodList}>
                {dishes.map((item) => (
                  <FoodCard
                    key={item.id}
                    id={String(item.id)}
                    name={item.name}
                    image_url={item.image_url}
                    onPress={handleFoodPress}
                  />
                ))}
              </View>

              {hasNextPage && (
                <TouchableOpacity
                  style={foodStyles.loadMoreButton}
                  onPress={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={foodStyles.loadMoreButtonText}>Tải thêm</Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}

          {activeTab === 'mine' && (
            <>
              {favoriteError && (
                <View style={foodStyles.errorContainer}>
                  <Ionicons name="alert-circle-outline" size={20} color={COLORS.purple} />
                  <Text style={foodStyles.errorText}>{favoriteError}</Text>
                </View>
              )}

              {!favoriteError && favoriteDishes.length === 0 && (
                <View style={foodStyles.emptyState}>
                  <Text style={foodStyles.emptyStateText}>Chưa có món ăn yêu thích nào</Text>
                </View>
              )}

              {!favoriteError && favoriteDishes.length > 0 && (
                <View style={foodStyles.foodList}>
                  {favoriteDishes.map((item) => (
                    <FoodCard
                      key={item.id}
                      id={String(item.id)}
                      name={item.name}
                      image_url={item.image_url}
                      onPress={handleFoodPress}
                    />
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
      </SafeAreaView>
    </View>
  );
}

