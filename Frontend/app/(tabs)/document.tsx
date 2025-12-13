import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/themes';
import FoodCard from '@/components/FoodCard';
import { getAccess } from '@/utils/api';

interface Dish {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  created_at: string;
}


export default function ExploreScreen() {
  const router = useRouter();
  const sessionExpiredRef = useRef(false);
  const [topRatedDishes, setTopRatedDishes] = useState<Dish[]>([]);
  const [topMenuDishes, setTopMenuDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [topRatedLoading, setTopRatedLoading] = useState(true);
  const [topMenuLoading, setTopMenuLoading] = useState(true);

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
      console.log('fetchTopRatedDishes error', err);
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
      console.log('fetchTopMenuDishes error', err);
      setTopMenuDishes([]);
    } finally {
      setTopMenuLoading(false);
    }
  }, [handleSessionExpired]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchTopRatedDishes(), fetchTopMenuDishes()]);
    setLoading(false);
  }, [fetchTopRatedDishes, fetchTopMenuDishes]);

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


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background || '#F5F5F5' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={{
        backgroundColor: COLORS.background || '#F5F5F5',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 16,
      }}>
        <Text style={{
          fontSize: 24,
          fontWeight: '700',
          color: COLORS.darkGrey,
          textAlign: 'center',
        }}>
          Khám phá
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.purple} />
        }
      >
        {/* Top Rated Dishes Section */}
        <View style={{ padding: 20, paddingBottom: 10 }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{
                width: 4,
                height: 20,
                backgroundColor: COLORS.purple,
                borderRadius: 2,
              }} />
              <Text style={{
                fontSize: 20,
                fontWeight: '700',
                color: COLORS.darkGrey,
              }}>
                Món ăn được đánh giá cao
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(food)' as any)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Text style={{ fontSize: 14, color: COLORS.purple, fontWeight: '600' }}>
                Xem tất cả
              </Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.purple} />
            </TouchableOpacity>
          </View>

          {topRatedLoading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={COLORS.purple} />
            </View>
          ) : topRatedDishes.length === 0 ? (
            <View style={{
              backgroundColor: COLORS.white,
              borderRadius: 12,
              padding: 24,
              alignItems: 'center',
            }}>
              <Ionicons name="star-outline" size={48} color={COLORS.grey} />
              <Text style={{ marginTop: 12, color: COLORS.grey }}>
                Chưa có món ăn được đánh giá cao
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 20 }}
            >
              {topRatedDishes.map((dish) => (
                <View key={dish.id} style={{ width: 200, flexShrink: 0 }}>
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
        <View style={{ padding: 20, paddingTop: 10 }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{
                width: 4,
                height: 20,
                backgroundColor: COLORS.purple,
                borderRadius: 2,
              }} />
              <Text style={{
                fontSize: 20,
                fontWeight: '700',
                color: COLORS.darkGrey,
              }}>
                Món ăn phổ biến trong menu
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(food)' as any)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Text style={{ fontSize: 14, color: COLORS.purple, fontWeight: '600' }}>
                Xem tất cả
              </Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.purple} />
            </TouchableOpacity>
          </View>

          {topMenuLoading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={COLORS.purple} />
            </View>
          ) : topMenuDishes.length === 0 ? (
            <View style={{
              backgroundColor: COLORS.white,
              borderRadius: 12,
              padding: 24,
              alignItems: 'center',
            }}>
              <Ionicons name="restaurant-outline" size={48} color={COLORS.grey} />
              <Text style={{ marginTop: 12, color: COLORS.grey }}>
                Chưa có món ăn phổ biến
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 20 }}
            >
              {topMenuDishes.map((dish) => (
                <View key={dish.id} style={{ width: 200, flexShrink: 0 }}>
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

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
