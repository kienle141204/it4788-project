import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl, Alert, Image, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/themes';
import FoodCard from '@/components/FoodCard';
import { getAccess } from '@/utils/api';

const { width } = Dimensions.get('window');

interface Dish {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  created_at: string;
  avgRating?: number;
  reviewCount?: number;
}


export default function ExploreScreen() {
  const router = useRouter();
  const sessionExpiredRef = useRef(false);
  const [topRatedDishes, setTopRatedDishes] = useState<Dish[]>([]);
  const [topMenuDishes, setTopMenuDishes] = useState<Dish[]>([]);
  const [rankingDishes, setRankingDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [topRatedLoading, setTopRatedLoading] = useState(true);
  const [topMenuLoading, setTopMenuLoading] = useState(true);
  const [rankingLoading, setRankingLoading] = useState(true);

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

  const fetchTopRatedDishes = useCallback(async () => {
    setTopRatedLoading(true);
    try {
      // API: GET /api/dishes/top-rated
      // Parameters: top (required), minRating (required), month (optional), year (optional)
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; // 1-12
      const currentYear = currentDate.getFullYear();

      const payload = await getAccess(
        `dishes/top-rated?top=10&minRating=4&month=${currentMonth}&year=${currentYear}`
      );

      if (payload?.success !== false && payload?.data) {
        const dishes: Dish[] = payload.data.map((item: any) => ({
          id: String(item.id || item.dish_id),
          name: item.name || item.dish?.name || '',
          description: item.description || item.dish?.description || '',
          image_url: item.image_url || item.dish?.image_url || null,
          created_at: item.created_at || item.dish?.created_at || '',
          avgRating: item.avgRating || 0,
          reviewCount: item.reviewCount || 0,
        }));
        setTopRatedDishes(dishes);
      } else {
        setTopRatedDishes([]);
      }
    } catch (err: any) {
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        handleSessionExpired();
        return;
      }
      setTopRatedDishes([]);
    } finally {
      setTopRatedLoading(false);
    }
  }, [handleSessionExpired]);

  const fetchTopMenuDishes = useCallback(async () => {
    setTopMenuLoading(true);
    try {
      // API: GET /api/dishes/top-menu
      // Parameters: top (required), month (optional), year (optional)
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1; // 1-12
      const currentYear = currentDate.getFullYear();

      const payload = await getAccess(
        `dishes/top-menu?top=10&month=${currentMonth}&year=${currentYear}`
      );

      if (payload?.success !== false && payload?.data) {
        const dishes: Dish[] = payload.data.map((item: any) => ({
          id: String(item.id || item.dish_id),
          name: item.name || item.dish?.name || '',
          description: item.description || item.dish?.description || '',
          image_url: item.image_url || item.dish?.image_url || null,
          created_at: item.created_at || item.dish?.created_at || '',
        }));
        setTopMenuDishes(dishes);
      } else {
        setTopMenuDishes([]);
      }
    } catch (err: any) {
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        handleSessionExpired();
        return;
      }
      setTopMenuDishes([]);
    } finally {
      setTopMenuLoading(false);
    }
  }, [handleSessionExpired]);

  const fetchRankingDishes = useCallback(async () => {
    setRankingLoading(true);
    try {
      // API: GET /api/dishes/top-rated for ranking (get more dishes, no minRating filter)
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      const payload = await getAccess(
        `dishes/top-rated?top=20&minRating=1&month=${currentMonth}&year=${currentYear}`
      );

      if (payload?.success !== false && payload?.data) {
        const dishes: Dish[] = payload.data.map((item: any) => ({
          id: String(item.id || item.dish_id),
          name: item.name || item.dish?.name || '',
          description: item.description || item.dish?.description || '',
          image_url: item.image_url || item.dish?.image_url || null,
          created_at: item.created_at || item.dish?.created_at || '',
          avgRating: item.avgRating || 0,
          reviewCount: item.reviewCount || 0,
        }));
        // Sort by rating descending
        dishes.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
        setRankingDishes(dishes.slice(0, 10)); // Top 10 for ranking
      } else {
        setRankingDishes([]);
      }
    } catch (err: any) {
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        handleSessionExpired();
        return;
      }
      setRankingDishes([]);
    } finally {
      setRankingLoading(false);
    }
  }, [handleSessionExpired]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchTopRatedDishes(), fetchTopMenuDishes(), fetchRankingDishes()]);
    setLoading(false);
  }, [fetchTopRatedDishes, fetchTopMenuDishes, fetchRankingDishes]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData().finally(() => setRefreshing(false));
  };

  const handleFoodPress = (id: string) => {
    router.push(`/(food)/${id}` as any);
  };

  const renderRankIcon = (index: number) => {
    if (index === 0) {
      return (
        <View style={styles.goldTrophyContainer}>
          <Ionicons name="trophy" size={28} color="#FFD700" />
          <View style={styles.trophyGlow} />
        </View>
      );
    } else if (index === 1) {
      return (
        <View style={styles.silverTrophyContainer}>
          <Ionicons name="trophy" size={26} color="#C0C0C0" />
        </View>
      );
    } else if (index === 2) {
      return (
        <View style={styles.bronzeTrophyContainer}>
          <Ionicons name="trophy" size={24} color="#CD7F32" />
        </View>
      );
    }
    return (
      <View style={styles.rankNumber}>
        <Text style={styles.rankNumberText}>{index + 1}</Text>
      </View>
    );
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={14} color="#FFD700" />
      );
    }
    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={14} color="#FFD700" />
      );
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons key={`empty-${i}`} name="star-outline" size={14} color="#D1D5DB" />
      );
    }
    return stars;
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} translucent={false} />
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: 10, backgroundColor: COLORS.background }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            Khám phá
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.purple} />
        }
      >
        {/* Ranking Section */}
        <View style={styles.rankingSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionIndicator} />
              <Text style={styles.sectionTitle}>
                Bảng xếp hạng món ăn
              </Text>
            </View>
            <View style={styles.trophyIconWrapper}>
              <Ionicons name="trophy" size={22} color="#FFD700" />
            </View>
          </View>

          {rankingLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : rankingDishes.length === 0 ? (
            <View style={styles.emptyRankingContainer}>
              <Ionicons name="trophy-outline" size={48} color={COLORS.grey} />
              <Text style={styles.emptyText}>
                Chưa có dữ liệu xếp hạng
              </Text>
            </View>
          ) : (
            <View style={styles.rankingContainer}>
              {/* Top 3 Podium */}
              {rankingDishes.length >= 3 && (
                <View style={styles.podiumContainer}>
                  {/* 2nd Place */}
                  <TouchableOpacity
                    style={styles.podiumItem}
                    onPress={() => handleFoodPress(rankingDishes[1].id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.podiumRank, styles.podiumSilver]}>
                      <Ionicons name="trophy" size={20} color="#C0C0C0" />
                      <Text style={styles.podiumRankText}>2</Text>
                    </View>
                    {rankingDishes[1].image_url ? (
                      <Image
                        source={{ uri: rankingDishes[1].image_url }}
                        style={styles.podiumImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.podiumImagePlaceholder}>
                        <Ionicons name="restaurant" size={16} color="#C0C0C0" />
                      </View>
                    )}
                    <Text style={styles.podiumName} numberOfLines={1}>
                      {rankingDishes[1].name}
                    </Text>
                    <View style={styles.podiumRating}>
                      <Ionicons name="star" size={12} color="#FFD700" />
                      <Text style={styles.podiumRatingText}>
                        {rankingDishes[1].avgRating?.toFixed(1) || '0.0'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* 1st Place */}
                  <TouchableOpacity
                    style={styles.podiumItem}
                    onPress={() => handleFoodPress(rankingDishes[0].id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.podiumRank, styles.podiumGold]}>
                      <Ionicons name="trophy" size={24} color="#FFD700" />
                      <Text style={styles.podiumRankText}>1</Text>
                    </View>
                    {rankingDishes[0].image_url ? (
                      <Image
                        source={{ uri: rankingDishes[0].image_url }}
                        style={styles.podiumImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.podiumImagePlaceholder}>
                        <Ionicons name="restaurant" size={18} color="#FFD700" />
                      </View>
                    )}
                    <Text style={styles.podiumName} numberOfLines={1}>
                      {rankingDishes[0].name}
                    </Text>
                    <View style={styles.podiumRating}>
                      <Ionicons name="star" size={12} color="#FFD700" />
                      <Text style={styles.podiumRatingText}>
                        {rankingDishes[0].avgRating?.toFixed(1) || '0.0'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* 3rd Place */}
                  <TouchableOpacity
                    style={styles.podiumItem}
                    onPress={() => handleFoodPress(rankingDishes[2].id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.podiumRank, styles.podiumBronze]}>
                      <Ionicons name="trophy" size={18} color="#CD7F32" />
                      <Text style={styles.podiumRankText}>3</Text>
                    </View>
                    {rankingDishes[2].image_url ? (
                      <Image
                        source={{ uri: rankingDishes[2].image_url }}
                        style={styles.podiumImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.podiumImagePlaceholder}>
                        <Ionicons name="restaurant" size={14} color="#CD7F32" />
                      </View>
                    )}
                    <Text style={styles.podiumName} numberOfLines={1}>
                      {rankingDishes[2].name}
                    </Text>
                    <View style={styles.podiumRating}>
                      <Ionicons name="star" size={12} color="#FFD700" />
                      <Text style={styles.podiumRatingText}>
                        {rankingDishes[2].avgRating?.toFixed(1) || '0.0'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {/* Ranking List - Show all if less than 3, otherwise show from 4th onwards */}
              <View style={styles.rankingList}>
                {rankingDishes.length >= 3 ? (
                  rankingDishes.slice(3).map((dish, index) => (
                    <TouchableOpacity
                      key={dish.id}
                      style={styles.rankingItem}
                      onPress={() => handleFoodPress(dish.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.rankingLeft}>
                        <View style={styles.rankIconContainer}>
                          {renderRankIcon(index + 3)}
                        </View>
                        {dish.image_url ? (
                          <Image
                            source={{ uri: dish.image_url }}
                            style={styles.rankingImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.rankingImagePlaceholder}>
                            <Ionicons name="restaurant" size={20} color={COLORS.purple} />
                          </View>
                        )}
                        <View style={styles.rankingInfo}>
                          <Text style={styles.rankingName} numberOfLines={1}>
                            {dish.name}
                          </Text>
                          <View style={styles.ratingContainer}>
                            <View style={styles.starsContainer}>
                              {renderStars(dish.avgRating || 0)}
                            </View>
                            <Text style={styles.ratingText}>
                              {dish.avgRating?.toFixed(1) || '0.0'}
                            </Text>
                            <Text style={styles.reviewCountText}>
                              ({dish.reviewCount || 0})
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.rankingBadge}>
                        <Text style={styles.rankingBadgeText}>
                          #{index + 4}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  rankingDishes.map((dish, index) => (
                    <TouchableOpacity
                      key={dish.id}
                      style={styles.rankingItem}
                      onPress={() => handleFoodPress(dish.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.rankingLeft}>
                        <View style={styles.rankIconContainer}>
                          {renderRankIcon(index)}
                        </View>
                        {dish.image_url ? (
                          <Image
                            source={{ uri: dish.image_url }}
                            style={styles.rankingImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.rankingImagePlaceholder}>
                            <Ionicons name="restaurant" size={20} color={COLORS.purple} />
                          </View>
                        )}
                        <View style={styles.rankingInfo}>
                          <Text style={styles.rankingName} numberOfLines={1}>
                            {dish.name}
                          </Text>
                          <View style={styles.ratingContainer}>
                            <View style={styles.starsContainer}>
                              {renderStars(dish.avgRating || 0)}
                            </View>
                            <Text style={styles.ratingText}>
                              {dish.avgRating?.toFixed(1) || '0.0'}
                            </Text>
                            <Text style={styles.reviewCountText}>
                              ({dish.reviewCount || 0})
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.rankingBadge}>
                        <Text style={styles.rankingBadgeText}>
                          #{index + 1}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </View>
          )}
        </View>

        {/* Top Rated Dishes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionIndicator} />
              <Text style={styles.sectionTitle}>
                Món ăn được đánh giá cao
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(food)' as any)}
              style={styles.seeAllButton}
            >
              <Text style={styles.seeAllText}>
                Xem tất cả
              </Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {topRatedLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : topRatedDishes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="star-outline" size={48} color={COLORS.grey} />
              <Text style={styles.emptyText}>
                Chưa có món ăn được đánh giá cao
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {topRatedDishes.map((dish) => (
                <View key={dish.id} style={styles.cardWrapper}>
                  <FoodCard
                    id={dish.id}
                    name={dish.name}
                    image_url={dish.image_url}
                    onPress={handleFoodPress}
                  />
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Top Menu Dishes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionIndicator} />
              <Text style={styles.sectionTitle}>
                Món ăn phổ biến trong menu
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(food)' as any)}
              style={styles.seeAllButton}
            >
              <Text style={styles.seeAllText}>
                Xem tất cả
              </Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {topMenuLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : topMenuDishes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={48} color={COLORS.grey} />
              <Text style={styles.emptyText}>
                Chưa có món ăn phổ biến
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {topMenuDishes.map((dish) => (
                <View key={dish.id} style={styles.cardWrapper}>
                  <FoodCard
                    id={dish.id}
                    name={dish.name}
                    image_url={dish.image_url}
                    onPress={handleFoodPress}
                  />
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.background || '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.purple}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.darkGrey,
    letterSpacing: 0.5,
  },
  headerDivider: {
    height: 3,
    width: 60,
    backgroundColor: COLORS.purple,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
  },
  rankingSection: {
    marginTop: 24,
    marginHorizontal: 20,
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIndicator: {
    width: 4,
    height: 24,
    backgroundColor: COLORS.purple,
    borderRadius: 2,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.darkGrey,
    flex: 1,
  },
  trophyIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${COLORS.purple}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.purple,
    marginRight: 4,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyRankingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.grey,
    marginTop: 12,
  },
  rankingContainer: {
    backgroundColor: COLORS.background || '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  podiumItem: {
    alignItems: 'center',
    flex: 1,
  },
  podiumRank: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    gap: 4,
  },
  podiumGold: {
    backgroundColor: '#FFF9E6',
    borderWidth: 2,
    borderColor: '#FFD700',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  podiumSilver: {
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#C0C0C0',
  },
  podiumBronze: {
    backgroundColor: '#FFF5E6',
    borderWidth: 2,
    borderColor: '#CD7F32',
  },
  podiumRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.darkGrey,
  },
  podiumImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: COLORS.lightGrey,
  },
  podiumImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.darkGrey,
    textAlign: 'center',
    marginBottom: 4,
    maxWidth: 80,
  },
  podiumRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  podiumRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.darkGrey,
  },
  rankingList: {
    gap: 12,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.lightGrey || '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  rankingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goldTrophyContainer: {
    position: 'relative',
  },
  trophyGlow: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFD700',
    opacity: 0.2,
    top: -6,
    left: -6,
  },
  silverTrophyContainer: {},
  bronzeTrophyContainer: {},
  rankNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white || '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.lightGrey,
  },
  rankNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.darkGrey,
  },
  rankingImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: COLORS.lightGrey,
  },
  rankingImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: COLORS.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankingInfo: {
    flex: 1,
  },
  rankingName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGrey,
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGrey,
  },
  reviewCountText: {
    fontSize: 12,
    color: COLORS.grey,
  },
  rankingBadge: {
    backgroundColor: COLORS.purple,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  rankingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  horizontalScrollContent: {
    paddingRight: 20,
    gap: 16,
  },
  cardWrapper: {
    marginRight: 12,
  },
  bottomSpacing: {
    height: 40,
  },
});
