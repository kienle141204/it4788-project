import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/themes';
import { getMyRefrigerators } from '@/service/fridge';
import { getAccess } from '@/utils/api';
import NotificationCard from '@/components/NotificationCard';

interface Refrigerator {
  id: number;
  name?: string;
  owner_id: number;
  family_id?: number | null;
  created_at: string;
  dishes?: any[];
  ingredients?: any[];
  fridgeDishes?: any[]; // Backend returns this
  fridgeIngredients?: any[]; // Backend returns this
  family?: {
    id: number;
    name: string;
  };
}

export default function FridgeListPage() {
  const router = useRouter();
  const [refrigerators, setRefrigerators] = useState<Refrigerator[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSessionExpired = useCallback(() => {
    Alert.alert(
      'Phiên đăng nhập hết hạn',
      'Vui lòng đăng nhập lại',
      [
        {
          text: 'OK',
          onPress: () => router.replace('/(auth)/login' as any),
        },
      ],
    );
  }, [router]);

  const fetchRefrigerators = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await getMyRefrigerators();

      // getMyRefrigerators now returns array directly
      let refrigeratorsData: Refrigerator[] = [];
      if (Array.isArray(response)) {
        refrigeratorsData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        refrigeratorsData = response.data;
      } else if (response && typeof response === 'object' && response.id) {
        // Backend returns single refrigerator object, wrap it in array
        refrigeratorsData = [response];
      }

      setRefrigerators(refrigeratorsData);
    } catch (err: any) {
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        handleSessionExpired();
        return;
      }

      // Handle 404 as "no refrigerators" - not an error
      // Check both axios error structure and direct statusCode
      const statusCode = err?.response?.status || err?.response?.data?.statusCode || err?.statusCode;
      if (statusCode === 404) {
        const errorMessage = err?.response?.data?.message || err?.message || '';
        // If the message indicates "no refrigerators", treat as empty list, not error
        if (errorMessage.includes('chưa có tủ lạnh') ||
          errorMessage.includes('Not Found') ||
          errorMessage.includes('not found')) {
          // User doesn't have any refrigerators yet - this is normal, not an error
          setRefrigerators([]);
          setError(null);
          return;
        }
      }

      setError('Không thể tải danh sách tủ lạnh. Vui lòng thử lại.');
      setRefrigerators([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [handleSessionExpired]);

  useEffect(() => {
    fetchRefrigerators();
  }, [fetchRefrigerators]);

  // Refresh danh sách khi màn hình được focus lại (ví dụ: quay lại từ màn hình create hoặc detail)
  useFocusEffect(
    useCallback(() => {
      // Always refresh when screen comes into focus to get latest data
      fetchRefrigerators(true); // Skip loading state for smoother UX
    }, [fetchRefrigerators])
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home' as any);
    }
  };

  const handleViewRefrigerator = (refrigerator: Refrigerator) => {
    router.push(`/(fridge)/${refrigerator.id}` as any);
  };

  const handleCreateRefrigerator = () => {
    router.push('/(fridge)/create' as any);
  };

  const handleRefresh = () => {
    fetchRefrigerators(true);
  };

  // Tính toán các sản phẩm sắp hết hạn hoặc đã hết hạn
  const getExpiringItems = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3);

    let expiringDishes = 0;
    let expiredDishes = 0;
    let expiringIngredients = 0;
    let expiredIngredients = 0;

    // Lưu thông tin chi tiết theo từng tủ lạnh
    const fridgeDetails: Array<{
      fridgeName: string;
      expiredCount: number;
      expiringCount: number;
    }> = [];

    refrigerators.forEach((fridge) => {
      let fridgeExpiredDishes = 0;
      let fridgeExpiringDishes = 0;
      let fridgeExpiredIngredients = 0;
      let fridgeExpiringIngredients = 0;

      // Kiểm tra món ăn
      const dishes = fridge.fridgeDishes || fridge.dishes || [];
      dishes.forEach((dish: any) => {
        // Chỉ tính các món có stock > 0 (chưa dùng)
        if (dish.stock > 0 && dish.expiration_date) {
          const expiryDate = new Date(dish.expiration_date);
          expiryDate.setHours(0, 0, 0, 0);

          if (expiryDate < today) {
            expiredDishes++;
            fridgeExpiredDishes++;
          } else if (expiryDate <= threeDaysLater) {
            expiringDishes++;
            fridgeExpiringDishes++;
          }
        }
      });

      // Kiểm tra nguyên liệu
      const ingredients = fridge.fridgeIngredients || fridge.ingredients || [];
      ingredients.forEach((ingredient: any) => {
        // Chỉ tính các nguyên liệu có stock > 0 (chưa dùng)
        if (ingredient.stock > 0 && ingredient.expiration_date) {
          const expiryDate = new Date(ingredient.expiration_date);
          expiryDate.setHours(0, 0, 0, 0);

          if (expiryDate < today) {
            expiredIngredients++;
            fridgeExpiredIngredients++;
          } else if (expiryDate <= threeDaysLater) {
            expiringIngredients++;
            fridgeExpiringIngredients++;
          }
        }
      });

      // Lưu thông tin tủ lạnh nếu có sản phẩm hết hạn hoặc sắp hết hạn
      const totalFridgeExpired = fridgeExpiredDishes + fridgeExpiredIngredients;
      const totalFridgeExpiring = fridgeExpiringDishes + fridgeExpiringIngredients;
      if (totalFridgeExpired > 0 || totalFridgeExpiring > 0) {
        const isFamily = fridge.family_id !== null && fridge.family_id !== undefined;
        const fridgeName = isFamily && fridge.family?.name
          ? fridge.family.name
          : (fridge.name || 'Tủ lạnh Cá nhân');
        
        fridgeDetails.push({
          fridgeName,
          expiredCount: totalFridgeExpired,
          expiringCount: totalFridgeExpiring,
        });
      }
    });

    return {
      expiringDishes,
      expiredDishes,
      expiringIngredients,
      expiredIngredients,
      totalExpiring: expiringDishes + expiringIngredients,
      totalExpired: expiredDishes + expiredIngredients,
      fridgeDetails, // Thêm thông tin chi tiết theo tủ lạnh
    };
  }, [refrigerators]);

  const expiringItems = getExpiringItems();

  const renderRefrigeratorCard = (refrigerator: Refrigerator) => {
    // Backend returns fridgeDishes and fridgeIngredients, not dishes and ingredients
    const dishCount = refrigerator.fridgeDishes?.length || refrigerator.dishes?.length || 0;
    const ingredientCount = refrigerator.fridgeIngredients?.length || refrigerator.ingredients?.length || 0;
    const isFamily = refrigerator.family_id !== null && refrigerator.family_id !== undefined;
    // Display name: use family name for family fridges, "Tủ lạnh Cá nhân" otherwise
    const displayName = isFamily && refrigerator.family?.name
      ? refrigerator.family.name
      : (refrigerator.name || 'Tủ lạnh Cá nhân');

    return (
      <TouchableOpacity
        key={refrigerator.id}
        style={{
          backgroundColor: COLORS.white,
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        }}
        onPress={() => handleViewRefrigerator(refrigerator)}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <View
            style={{
              backgroundColor: COLORS.greenLight,
              padding: 12,
              borderRadius: 12,
              marginRight: 12,
            }}
          >
            <Ionicons name="snow" size={24} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: COLORS.darkGrey,
                marginBottom: 4,
              }}
            >
              {displayName}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 4,
              }}
            >
              <Ionicons
                name={isFamily ? 'people' : 'person'}
                size={14}
                color={COLORS.grey}
              />
              <Text
                style={{
                  fontSize: 12,
                  color: COLORS.grey,
                  marginLeft: 4,
                }}
              >
                {isFamily ? 'Gia đình' : 'Cá nhân'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.grey} />
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: COLORS.background || '#F5F5F5',
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="restaurant" size={20} color="#F97316" />
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: COLORS.darkGrey,
                marginTop: 4,
              }}
            >
              {dishCount}
            </Text>
            <Text style={{ fontSize: 12, color: COLORS.grey }}>Món ăn</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="leaf" size={20} color={COLORS.primary} />
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: COLORS.darkGrey,
                marginTop: 4,
              }}
            >
              {ingredientCount}
            </Text>
            <Text style={{ fontSize: 12, color: COLORS.grey }}>Nguyên liệu</Text>
          </View>
        </View>
      </TouchableOpacity >
    );
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
          Tủ lạnh
        </Text>

        <TouchableOpacity onPress={handleCreateRefrigerator}>
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Refrigerator List */}
      {loading ? (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 12, color: COLORS.grey }}>Đang tải...</Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >
          {error ? (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 40,
              }}
            >
              <Ionicons name="alert-circle-outline" size={48} color={COLORS.red || '#EF4444'} />
              <Text style={{ marginTop: 16, color: COLORS.darkGrey, fontSize: 16 }}>
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
                onPress={() => fetchRefrigerators()}
              >
                <Text style={{ color: COLORS.white, fontWeight: '600' }}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : refrigerators.length === 0 ? (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 60,
              }}
            >
              <Ionicons name="snow-outline" size={64} color={COLORS.grey} />
              <Text
                style={{
                  marginTop: 16,
                  fontSize: 18,
                  fontWeight: '600',
                  color: COLORS.darkGrey,
                }}
              >
                Chưa có tủ lạnh nào
              </Text>
              <Text
                style={{
                  marginTop: 8,
                  fontSize: 14,
                  color: COLORS.grey,
                  textAlign: 'center',
                }}
              >
                Tạo tủ lạnh mới để bắt đầu quản lý thực phẩm
              </Text>
              <TouchableOpacity
                style={{
                  marginTop: 24,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  backgroundColor: COLORS.primary,
                  borderRadius: 8,
                }}
                onPress={handleCreateRefrigerator}
              >
                <Text style={{ color: COLORS.white, fontWeight: '600' }}>
                  Tạo tủ lạnh mới
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Cảnh báo sản phẩm sắp hết hạn hoặc đã hết hạn */}
              {(expiringItems.totalExpiring > 0 || expiringItems.totalExpired > 0) && (
                <View style={{ marginBottom: 16 }}>
                  <NotificationCard
                    title="Cảnh báo hết hạn"
                    message={
                      (() => {
                        const fridgeDetails = expiringItems.fridgeDetails || [];
                        if (fridgeDetails.length === 0) {
                          return expiringItems.totalExpired > 0
                            ? `Có ${expiringItems.totalExpired} sản phẩm đã hết hạn và ${expiringItems.totalExpiring} sản phẩm sắp hết hạn (≤ 3 ngày). Vui lòng kiểm tra ngay!`
                            : `Có ${expiringItems.totalExpiring} sản phẩm sắp hết hạn trong vòng 3 ngày tới. Vui lòng kiểm tra!`;
                        }

                        // Tạo thông báo chi tiết với tên tủ lạnh
                        const fridgeMessages = fridgeDetails.map((fridge) => {
                          const parts: string[] = [];
                          if (fridge.expiredCount > 0) {
                            parts.push(`${fridge.expiredCount} đã hết hạn`);
                          }
                          if (fridge.expiringCount > 0) {
                            parts.push(`${fridge.expiringCount} sắp hết hạn`);
                          }
                          return `${fridge.fridgeName} (${parts.join(', ')})`;
                        });

                        const summary = expiringItems.totalExpired > 0
                          ? `Có ${expiringItems.totalExpired} sản phẩm đã hết hạn và ${expiringItems.totalExpiring} sản phẩm sắp hết hạn (≤ 3 ngày)`
                          : `Có ${expiringItems.totalExpiring} sản phẩm sắp hết hạn (≤ 3 ngày)`;

                        return `${summary} tại: ${fridgeMessages.join('; ')}. Vui lòng kiểm tra ngay!`;
                      })()
                    }
                    type="warning"
                  />
                </View>
              )}

              {refrigerators.map(renderRefrigeratorCard)}

              {/* Floating Action Button */}
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  right: 20,
                  bottom: 20,
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: COLORS.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                }}
                onPress={handleCreateRefrigerator}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={28} color={COLORS.white} />
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

