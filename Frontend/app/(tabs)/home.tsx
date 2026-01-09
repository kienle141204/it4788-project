import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet } from 'react-native';
import { BackHandler, ToastAndroid } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

// Import components
import Header from '@/components/Header';
import TaskSummaryCard from '@/components/TaskSummaryCard';
import NotificationCard from '@/components/NotificationCard';
import FeatureGrid from '@/components/FeatureGrid';
import { COLORS } from '@/constants/themes';
import { getAccess, logoutUser } from '@/utils/api';
import { getCachedAccess, refreshCachedAccess, CACHE_TTL } from '@/utils/cachedApi';
import { useNotifications } from '@/context/NotificationsContext';
import { getMyShoppingLists } from '@/service/shopping';

type UserProfile = {
  id: number;
  email: string;
  full_name?: string;
  fullname?: string;
  avatar_url: string | null;
  address: string | null;
  phone: string | null;
  role: string;
  created_at: string;
  updated_at: string;
};

interface TodayTasks {
  totalItems: number;
  completedItems: number;
}

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function HomePage() {
  const router = useRouter();
  const backPressCount = useRef(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [todayTasks, setTodayTasks] = useState<TodayTasks>({ totalItems: 0, completedItems: 0 });
  const { unreadCount, refreshNotifications } = useNotifications();

  // Animation value for content fade-in - start with visible to avoid flicker
  const contentOpacity = useSharedValue(1);

  const animateContentIn = () => {
    contentOpacity.value = 0;
    contentOpacity.value = withTiming(1, { duration: 400 });
  };

  const fetchProfile = useCallback(async (isRefreshing = false) => {
    try {
      let response: any;
      if (isRefreshing) {
        // Force refresh
        const result = await refreshCachedAccess<any>(
          'auth/profile',
          {},
          {
            ttl: CACHE_TTL.SHORT,
            cacheKey: 'home:profile',
            compareData: true,
          }
        );
        response = result.data;
      } else {
        // Use cache if available
        const result = await getCachedAccess<any>(
          'auth/profile',
          {},
          {
            ttl: CACHE_TTL.SHORT,
            cacheKey: 'home:profile',
            compareData: true,
          }
        );
        response = result.data;
        
        // If we got data from cache, fetch fresh data in background
        if (result.fromCache) {
          refreshCachedAccess<any>(
            'auth/profile',
            {},
            {
              ttl: CACHE_TTL.SHORT,
              cacheKey: 'home:profile',
              compareData: true,
            }
          ).then((freshResult) => {
            if (freshResult.updated) {
              const userData = freshResult.data?.data || freshResult.data;
              setProfile(userData);
            }
          }).catch(() => {
            // Silently fail background refresh
          });
        }
      }
      
      // API response có cấu trúc: { success, message, data: { ...userInfo } }
      const userData = response?.data || response;
      setProfile(userData);
    } catch (err: any) {
      // Xử lý lỗi SESSION_EXPIRED - redirect về login
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        try {
          await logoutUser();
          router.replace('/(auth)' as any);
        } catch (logoutError) {
          console.error('[Home] Error during logout:', logoutError);
          router.replace('/(auth)' as any);
        }
        return;
      }
      // Không hiển thị lỗi khác để không làm gián đoạn trải nghiệm người dùng
    }
  }, [router]);

  // Helper function to check if two dates are the same day
  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  // Fetch shopping lists của hôm nay để tính nhiệm vụ
  const fetchTodayTasks = useCallback(async () => {
    try {
      const lists = await getMyShoppingLists();

      if (!Array.isArray(lists)) {
        setTodayTasks({ totalItems: 0, completedItems: 0 });
        return;
      }

      // Lấy ngày hôm nay
      const today = new Date();

      // Lọc shopping lists của hôm nay
      let totalItems = 0;
      let completedItems = 0;

      lists.forEach((list: any) => {
        if (!list.shopping_date) return;

        // So sánh ngày shopping_date với ngày hôm nay
        const listDate = new Date(list.shopping_date);

        if (isSameDay(listDate, today) && Array.isArray(list.items)) {
          list.items.forEach((item: any) => {
            totalItems += 1;
            if (item.is_checked) {
              completedItems += 1;
            }
          });
        }
      });

      setTodayTasks({ totalItems, completedItems });
    } catch (err: any) {
      setTodayTasks({ totalItems: 0, completedItems: 0 });
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchTodayTasks();
    refreshNotifications();
    animateContentIn();
  }, [fetchProfile, fetchTodayTasks, refreshNotifications]);

  // Animated style for content
  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  // Refresh data khi màn hình được focus
  useFocusEffect(
    useCallback(() => {
      fetchProfile(true); // Refresh profile on focus
      fetchTodayTasks();
      refreshNotifications();
      animateContentIn(); // Re-animate content when screen is focused
    }, [fetchProfile, fetchTodayTasks, refreshNotifications])
  );

  // Xử lý nút back - chỉ hoạt động khi đang ở trang home
  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        if (backPressCount.current === 0) {
          backPressCount.current += 1;
          ToastAndroid.show('Nhấn quay lại lần nữa để thoát ứng dụng', ToastAndroid.SHORT);

          setTimeout(() => {
            backPressCount.current = 0;
          }, 2000);
          return true;
        } else {
          BackHandler.exitApp();
          return true;
        }
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
      return () => {
        backHandler.remove();
        backPressCount.current = 0; // Reset counter khi rời khỏi trang
      };
    }, [])
  );

  const handleNotificationPress = () => {
    router.push('/(notifications)' as any);
  };

  const handleMenuPress = () => {
    Alert.alert('Menu', 'Menu tùy chọn');
  };

  const handleViewTasks = () => {
    // Chuyển đến trang Nhiệm vụ của tôi (calendar)
    router.push('/(tabs)/calendar' as any);
  };

  const features = [
    { id: 'group', name: 'Nhóm', icon: 'people' as const, color: '#A855F7', bgColor: '#F3E8FF', onPress: () => router.push('/(group)') },
    { id: 'shopping', name: 'Mua sắm', icon: 'cart' as const, color: '#3B82F6', bgColor: '#DBEAFE', onPress: () => router.push('/(market)/market_screen') },
    { id: 'meals', name: 'Bữa ăn', icon: 'restaurant' as const, color: '#F97316', bgColor: '#FFEDD5', onPress: () => router.push('/(meal)') },
    // { id: 'nutrition', name: 'Dinh dưỡng', icon: 'shield' as const, color: '#EF4444', bgColor: '#FEE2E2', onPress: () => Alert.alert('Dinh dưỡng', 'Chức năng dinh dưỡng') },
    { id: 'fridge', name: 'Tủ lạnh', icon: 'snow' as const, color: COLORS.green, bgColor: COLORS.greenLight, onPress: () => router.push('/(fridge)') },
    { id: 'recipes', name: 'Công thức', icon: 'book' as const, color: '#6366F1', bgColor: '#E0E7FF', onPress: () => router.push('/(food)' as any) },
    { id: 'statistics', name: 'Thống kê', icon: 'stats-chart' as const, color: '#EC4899', bgColor: '#FCE7F3', onPress: () => router.push('/(statistics)' as any) },
    { id: 'nearest-market', name: 'Chợ gần đây', icon: 'location' as const, color: '#1565C0', bgColor: '#E3F2FD', onPress: () => router.push('/(market)/nearest-market') }
  ];

  return (
    <View style={styles.container}>
      <AnimatedScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <Animated.View style={contentAnimatedStyle}>
          <Header
            userName={profile?.full_name || profile?.fullname || 'Người dùng'}
            avatarUrl={profile?.avatar_url}
            onNotificationPress={handleNotificationPress}
            onMenuPress={handleMenuPress}
          />

          <TaskSummaryCard
            totalTasks={todayTasks.totalItems}
            completedTasks={todayTasks.completedItems}
            onViewTasks={handleViewTasks}
          />

          {/* <View style={styles.notificationSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Thông báo</Text>
              <Ionicons name="sparkles" size={20} color={COLORS.purple} />
            </View>

            <NotificationCard
              title="Thực phẩm sắp hết hạn"
              message="Kiểm tra tủ lạnh của bạn ngay!"
              type="warning"
            />
          </View> */}

          {/* Features Grid */}
          <View style={styles.featuresSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Chức năng</Text>
              {/* <Ionicons name="sparkles" size={20} color={COLORS.purple} /> */}
            </View>
            <FeatureGrid features={features} />
          </View>
        </Animated.View>

      </AnimatedScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background || COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  notificationSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGrey,
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
});
