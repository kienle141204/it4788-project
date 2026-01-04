import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getIngredientById } from "@/service/market";
import { COLORS } from "@/constants/themes";

export default function IngredientDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const ingredientId = params.id ? parseInt(params.id as string) : null;
  const insets = useSafeAreaInsets();

  const [ingredient, setIngredient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSessionExpired = () => {
    Alert.alert('Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại');
    router.replace('/(auth)/login');
  };

  useEffect(() => {
    const fetchIngredient = async () => {
      if (!ingredientId) {
        setError("Không tìm thấy ID nguyên liệu");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await getIngredientById(ingredientId);
        
        // Check if response exists
        if (!res) {
          setError("Không thể kết nối đến máy chủ");
          return;
        }
        
        if (res?.data) {
          setIngredient(res.data);
        } else if (res?.statusCode) {
          setError(res.message || "Không tìm thấy nguyên liệu");
        } else {
          setError("Phản hồi không hợp lệ từ máy chủ");
        }
      } catch (e: any) {
        if (e?.message === 'SESSION_EXPIRED' || e?.response?.status === 401) {
          handleSessionExpired();
          return;
        }
        setError(e.message || "Có lỗi xảy ra khi tải thông tin nguyên liệu");
      } finally {
        setLoading(false);
      }
    };

    fetchIngredient();
  }, [ingredientId]);

  if (loading) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      </View>
    );
  }

  if (error || !ingredient) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.grey} />
          <Text style={styles.errorText}>{error || "Không tìm thấy nguyên liệu"}</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/home' as any);
              }
            }}
          >
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header với nút back */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity 
            style={styles.backButtonHeader}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/home' as any);
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.darkGrey} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết nguyên liệu</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: ingredient.image_url || 'https://via.placeholder.com/400' }} 
            style={styles.image}
            defaultSource={require('../../assets/images/logo.png')}
          />
          <View style={styles.favoriteButton}>
            <Ionicons name="heart-outline" size={24} color={COLORS.darkGrey} />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Tên và giá */}
          <View style={styles.titleSection}>
            <Text style={styles.name}>{ingredient.name}</Text>
            {ingredient.price && (
              <Text style={styles.price}>
                {parseInt(ingredient.price).toLocaleString('vi-VN')} ₫
              </Text>
            )}
          </View>

          {/* Category và Place */}
          <View style={styles.infoRow}>
            {ingredient.category && (
              <View style={styles.infoItem}>
                <Ionicons name="pricetag-outline" size={20} color={COLORS.primary} />
                <Text style={styles.infoText}>{ingredient.category.name}</Text>
              </View>
            )}
            {ingredient.place && (
              <View style={styles.infoItem}>
                <Ionicons name="location-outline" size={20} color={COLORS.primary} />
                <Text style={styles.infoText}>{ingredient.place.name_place}</Text>
              </View>
            )}
          </View>

          {/* Mô tả */}
          {ingredient.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Mô tả</Text>
              <Text style={styles.description}>{ingredient.description}</Text>
            </View>
          )}

          {/* Action Buttons */}
          {/* <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.addToCartButton}
              activeOpacity={0.7}
            >
              <Ionicons name="cart-outline" size={20} color="#fff" />
              <Text style={styles.addToCartText}>Thêm vào giỏ hàng</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.buyNowButton}
              activeOpacity={0.7}
            >
              <Text style={styles.buyNowText}>Mua ngay</Text>
            </TouchableOpacity>
          </View> */}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.grey,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.grey,
    textAlign: "center",
    marginBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 12,
    backgroundColor: COLORS.background,
  },
  backButtonHeader: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: COLORS.lightGrey,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.darkGrey,
  },
  placeholder: {
    width: 40,
  },
  imageContainer: {
    width: "100%",
    height: 300,
    position: "relative",
    backgroundColor: COLORS.lightGrey,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  favoriteButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.shadow || "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    padding: 20,
  },
  titleSection: {
    marginBottom: 16,
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.darkGrey,
    marginBottom: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.primary,
  },
  infoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightGrey,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.darkGrey,
    fontWeight: "500",
  },
  descriptionSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.darkGrey,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.grey,
  },
  additionalInfo: {
    marginBottom: 24,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightGrey,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardLabel: {
    fontSize: 12,
    color: COLORS.grey,
    marginBottom: 4,
  },
  infoCardValue: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.darkGrey,
  },
  actionButtons: {
    gap: 12,
    marginBottom: 20,
  },
  addToCartButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  addToCartText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  buyNowButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buyNowText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
});

