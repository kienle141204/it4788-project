import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Image, ActivityIndicator, TextInput, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS } from '../../constants/themes';
import { foodDetailStyles } from '../../styles/foodDetail.styles';
import { getAccess, postAccess, patchAccess, deleteAccess } from '../../utils/api';

type IconName = keyof typeof Ionicons.glyphMap;

interface Dish {
  id: string | number;
  name: string;
  description: string;
  image_url: string | null;
  created_at: string;
}

interface RecipeStepImage {
  id: string | number;
  recipe_steps_id: string | number;
  url: string;
  created_at: string;
}

interface RecipeStep {
  id: string | number;
  recipe_id: string | number;
  step_number: number;
  description: string;
  images?: RecipeStepImage[];
}

interface Recipe {
  id: string | number;
  dish_id: string | number;
  owner_id?: string | number;
  status?: string | null;
  created_at?: string;
  dish?: Dish;
  owner?: User;
  steps: RecipeStep[];
}

interface User {
  id: string | number;
  email: string;
  full_name: string;
  avatar_url: string | null;
}

interface Review {
  id: string | number;
  dish_id: string | number;
  user_id: string | number;
  rating: number;
  comment: string;
  created_at: string;
  user: User;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    [key: string]: number;
  };
}

interface Nutrient {
  id: string | number;
  description: string;
}

export default function FoodDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const dishId = id ? parseInt(id, 10) : null;
  const sessionExpiredRef = useRef(false);
  const [dish, setDish] = useState<Dish | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [recipeLoading, setRecipeLoading] = useState(true);
  const [recipeError, setRecipeError] = useState<string | null>(null);
  const [isRecipeExpanded, setIsRecipeExpanded] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [isReviewsExpanded, setIsReviewsExpanded] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsHasMore, setReviewsHasMore] = useState(true);
  const [reviewsLoadingMore, setReviewsLoadingMore] = useState(false);
  const REVIEWS_PER_PAGE = 3;
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [nutrients, setNutrients] = useState<Nutrient[]>([]);
  const [nutrientsLoading, setNutrientsLoading] = useState(true);
  const [nutrientsError, setNutrientsError] = useState<string | null>(null);
  const [isNutrientsExpanded, setIsNutrientsExpanded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

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

  const fetchReviews = useCallback(async (page: number = 1, append: boolean = false) => {
    if (!dishId) return;

    if (!append) {
      setReviewsLoading(true);
      setReviewsError(null);
    } else {
      setReviewsLoadingMore(true);
    }

    try {
      // Ensure page and limit are valid numbers
      const validPage = Math.max(1, Math.floor(page) || 1);
      const validLimit = Math.max(1, Math.floor(REVIEWS_PER_PAGE) || 3);

      const payload = await getAccess(`dishes/${dishId}/reviews`, {
        page: validPage,
        limit: validLimit,
      });

      if (!payload?.success) {
        throw new Error(payload?.message || 'Không thể tải đánh giá');
      }

      if (Array.isArray(payload.data)) {
        if (append) {
          setReviews((prev) => [...prev, ...payload.data]);
        } else {
          setReviews(payload.data);
        }

        // Check if there are more reviews
        setReviewsHasMore(payload.data.length === validLimit);
      } else {
        if (!append) {
          setReviews([]);
        }
        setReviewsHasMore(false);
      }
    } catch (err: any) {
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        handleSessionExpired();
        return;
      }

      // If pagination fails with 500, try without pagination as fallback
      if (err?.response?.status === 500 && !append) {
        console.warn('Pagination failed, trying without pagination...');
        try {
          const fallbackPayload = await getAccess(`dishes/${dishId}/reviews`);
          if (fallbackPayload?.success && Array.isArray(fallbackPayload.data)) {
            // Client-side pagination: only show first 3
            const firstPage = fallbackPayload.data.slice(0, REVIEWS_PER_PAGE);
            setReviews(firstPage);
            setReviewsHasMore(fallbackPayload.data.length > REVIEWS_PER_PAGE);
            setReviewsError(null);
            return;
          }
        } catch (fallbackErr) {
          console.error('Fallback also failed:', fallbackErr);
        }
      }

      console.log(err);
      if (!append) {
        setReviews([]);
        setReviewsError('Không thể tải đánh giá. Vui lòng thử lại.');
      }
      setReviewsHasMore(false);
    } finally {
      setReviewsLoading(false);
      setReviewsLoadingMore(false);
    }
  }, [dishId, handleSessionExpired]);

  useEffect(() => {
    const fetchDish = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!dishId) return;
        const payload = await getAccess(`dishes/get-info-dish-by-id/${dishId}`);

        if (!payload?.success) {
          throw new Error(payload?.message || 'Không thể tải thông tin món ăn');
        }

        if (payload.data) {
          setDish(payload.data);
        } else {
          setDish(null);
          setError('Không tìm thấy món ăn');
        }
      } catch (err: any) {
        if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
          handleSessionExpired();
          return;
        }
        console.log(err);
        setDish(null);
        setError('Không thể tải thông tin món ăn. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    const fetchRecipe = async () => {
      setRecipeLoading(true);
      setRecipeError(null);

      try {
        if (!dishId) return;

        // Gọi API recipes/by-dish/{dishId} để lấy công thức theo món ăn
        const payload = await getAccess(`recipes/by-dish/${dishId}`);

        if (!payload?.success) {
          throw new Error(payload?.message || 'Không thể tải công thức');
        }

        // API trả về mảng công thức, lấy công thức đầu tiên
        const recipes = payload?.data;
        if (recipes && Array.isArray(recipes) && recipes.length > 0) {
          // Sắp xếp steps theo step_number trước khi set
          const firstRecipe = recipes[0];
          if (firstRecipe.steps && Array.isArray(firstRecipe.steps)) {
            firstRecipe.steps.sort((a: RecipeStep, b: RecipeStep) => a.step_number - b.step_number);
          }
          setRecipe(firstRecipe);
        } else {
          setRecipe(null);
          setRecipeError('Chưa có công thức cho món ăn này');
        }
      } catch (err: any) {
        if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
          handleSessionExpired();
          return;
        }
        console.log('fetchRecipe error', err);
        setRecipe(null);
        setRecipeError('Không thể tải công thức. Vui lòng thử lại.');
      } finally {
        setRecipeLoading(false);
      }
    };


    const fetchReviewStats = async () => {
      setStatsLoading(true);

      try {
        if (!dishId) return;
        const payload = await getAccess(`dishes/${dishId}/reviews/stats`);

        if (payload?.success && payload.data) {
          setReviewStats(payload.data);
        } else {
          setReviewStats(null);
        }
      } catch (err: any) {
        if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
          handleSessionExpired();
          return;
        }
        console.log(err);
        setReviewStats(null);
      } finally {
        setStatsLoading(false);
      }
    };

    const fetchUserReview = async () => {
      try {
        if (!dishId) return;
        const payload = await getAccess(`dishes/${dishId}/reviews/my-review`);
        if (payload?.success && payload.data) {
          setUserReview(payload.data);
        }
      } catch (err: any) {
        if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
          handleSessionExpired();
          return;
        }
        // Không có review của user là trường hợp bình thường, không cần xử lý lỗi
        console.log('No user review yet');
      }
    };

    const fetchNutrients = async () => {
      setNutrientsLoading(true);
      setNutrientsError(null);

      try {
        if (!dishId) return;
        const payload = await getAccess(`nutrients/dish/${dishId}`);

        if (!payload?.success) {
          throw new Error(payload?.message || 'Không thể tải thông tin dinh dưỡng');
        }

        if (payload.data?.nutrients && Array.isArray(payload.data.nutrients)) {
          setNutrients(payload.data.nutrients);
        } else {
          setNutrients([]);
          setNutrientsError('Chưa có thông tin dinh dưỡng cho món ăn này');
        }
      } catch (err: any) {
        if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
          handleSessionExpired();
          return;
        }
        console.log(err);
        setNutrients([]);
        setNutrientsError('Không thể tải thông tin dinh dưỡng. Vui lòng thử lại.');
      } finally {
        setNutrientsLoading(false);
      }
    };

    const checkFavoriteStatus = async () => {
      try {
        if (!dishId) return;
        const payload = await getAccess(`favorite-dishes/check/${dishId}`);

        // Backend trả về: { success: true, message: '...', data: { isFavorite: boolean } }
        if (payload?.success === true && payload?.data) {
          const isFavoriteValue = payload.data.isFavorite;
          if (typeof isFavoriteValue === 'boolean') {
            setIsFavorite(isFavoriteValue);
          } else {
            // Fallback: nếu không có isFavorite, mặc định là false
            setIsFavorite(false);
          }
        } else if (payload?.success === undefined && payload?.data?.isFavorite !== undefined) {
          // Trường hợp response không có success field nhưng có data
          setIsFavorite(payload.data.isFavorite);
        } else {
          // Nếu không có data, mặc định là false
          setIsFavorite(false);
        }
      } catch (err: any) {
        if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
          handleSessionExpired();
          return;
        }
        // Không có favorite hoặc lỗi khi kiểm tra là trường hợp bình thường
        // Mặc định set là false và không hiển thị lỗi cho user
        console.log('Error checking favorite status:', err);
        setIsFavorite(false);
      }
    };

    if (dishId) {
      fetchDish();
      fetchRecipe();
      fetchReviews(1, false);
      setReviewsPage(1);
      fetchReviewStats();
      fetchUserReview();
      fetchNutrients();
      checkFavoriteStatus();
    }
  }, [dishId, handleSessionExpired, fetchReviews]);

  const handleLoadMoreReviews = useCallback(() => {
    if (!reviewsLoadingMore && reviewsHasMore) {
      const nextPage = reviewsPage + 1;
      setReviewsPage(nextPage);
      fetchReviews(nextPage, true);
    }
  }, [reviewsPage, reviewsHasMore, reviewsLoadingMore, fetchReviews]);

  const handleBack = () => {
    router.back();
  };

  const handleToggleFavorite = async () => {
    if (!dishId || favoriteLoading) return;

    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        // Xóa khỏi yêu thích - DELETE /api/favorite-dishes/dish/{dishId}
        const payload = await deleteAccess(`favorite-dishes/dish/${dishId}`);

        // Backend trả về { success: true, message: '...' }
        if (payload?.success === true || (payload?.success === undefined && !payload?.message)) {
          setIsFavorite(false);
          Alert.alert('Thành công', payload?.message || 'Đã xóa món ăn khỏi danh sách yêu thích');
        } else {
          throw new Error(payload?.message || 'Không thể xóa khỏi danh sách yêu thích');
        }
      } else {
        // Thêm vào yêu thích - POST /api/favorite-dishes
        const payload = await postAccess('favorite-dishes', {
          dish_id: dishId,
        });

        // Backend trả về { success: true, message: '...', data: {...} }
        if (payload?.success === true || (payload?.success === undefined && !payload?.message)) {
          setIsFavorite(true);
          Alert.alert('Thành công', payload?.message || 'Đã thêm món ăn vào danh sách yêu thích');
        } else {
          throw new Error(payload?.message || 'Không thể thêm vào danh sách yêu thích');
        }
      }
    } catch (err: any) {
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        handleSessionExpired();
        return;
      }
      console.error('handleToggleFavorite error', err);

      let errorMessage = 'Không thể cập nhật danh sách yêu thích. Vui lòng thử lại.';

      if (err?.response?.status === 409) {
        errorMessage = 'Món ăn đã có trong danh sách yêu thích';
      } else if (err?.response?.status === 404) {
        errorMessage = 'Không tìm thấy món ăn';
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      Alert.alert('Lỗi', errorMessage);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleShareDish = async () => {
    if (!dish) {
      return;
    }

    try {
      await Share.share({
        title: dish.name,
        message: `${dish.name}\n\n${dish.description || ''}`.trim(),
      });
    } catch (shareError: any) {
      if (shareError?.message !== 'User did not share') {
        Alert.alert('Lỗi', 'Không thể chia sẻ món ăn lúc này.');
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const parseDescription = (description: string) => {
    const lines = description.split('\n');
    const sections: { type: 'text' | 'list'; content: string[] }[] = [];

    let currentSection: string[] = [];

    lines.forEach(line => {
      if (line.trim().startsWith('-')) {
        // List item
        if (currentSection.length > 0 && !currentSection[0].startsWith('-')) {
          sections.push({ type: 'text', content: currentSection });
          currentSection = [];
        }
        currentSection.push(line.trim());
      } else if (line.trim()) {
        // Text line
        if (currentSection.length > 0 && currentSection[0].startsWith('-')) {
          sections.push({ type: 'list', content: currentSection });
          currentSection = [];
        }
        currentSection.push(line.trim());
      }
    });

    if (currentSection.length > 0) {
      sections.push({
        type: currentSection[0].startsWith('-') ? 'list' : 'text',
        content: currentSection
      });
    }

    return sections;
  };

  const handleUpdateReview = async () => {
    if (!userReview || !newComment.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập bình luận');
      return;
    }

    if (newRating < 1 || newRating > 5) {
      Alert.alert('Lỗi', 'Vui lòng chọn điểm đánh giá từ 1 đến 5');
      return;
    }

    setSubmittingReview(true);

    try {
      const response = await patchAccess(`dishes/${dishId}/reviews/${String(userReview.id)}`, {
        rating: newRating,
        comment: newComment.trim(),
      });

      if (response?.success) {
        Alert.alert('Thành công', 'Cập nhật đánh giá thành công');
        setShowReviewForm(false);
        setIsEditingReview(false);

        // Refresh user review and all reviews
        const userReviewPayload = await getAccess(`dishes/${dishId}/reviews/my-review`);
        if (userReviewPayload?.success && userReviewPayload.data) {
          setUserReview(userReviewPayload.data);
        }

        // Reset pagination and fetch first page
        setReviewsPage(1);
        await fetchReviews(1, false);

        const statsPayload = await getAccess(`dishes/${dishId}/reviews/stats`);
        if (statsPayload?.success && statsPayload.data) {
          setReviewStats(statsPayload.data);
        }
      } else {
        Alert.alert('Lỗi', response?.message || 'Không thể cập nhật đánh giá');
      }
    } catch (err: any) {
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        handleSessionExpired();
        return;
      }
      console.log(err);
      Alert.alert('Lỗi', 'Không thể cập nhật đánh giá. Vui lòng thử lại.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!userReview) return;

    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc muốn xóa đánh giá này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deleteAccess(`dishes/${dishId}/reviews/${String(userReview.id)}`);

              if (response?.success) {
                Alert.alert('Thành công', 'Đã xóa đánh giá');
                setUserReview(null);
                setShowReviewForm(false);
                setIsEditingReview(false);
                setNewRating(5);
                setNewComment('');

                // Reset pagination and refresh reviews
                setReviewsPage(1);
                await fetchReviews(1, false);

                const statsPayload = await getAccess(`dishes/${dishId}/reviews/stats`);
                if (statsPayload?.success && statsPayload.data) {
                  setReviewStats(statsPayload.data);
                }
              } else {
                Alert.alert('Lỗi', response?.message || 'Không thể xóa đánh giá');
              }
            } catch (err: any) {
              if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
                handleSessionExpired();
                return;
              }
              console.log(err);
              Alert.alert('Lỗi', 'Không thể xóa đánh giá. Vui lòng thử lại.');
            }
          },
        },
      ]
    );
  };

  const handleSubmitReview = async () => {
    if (!newComment.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập bình luận');
      return;
    }

    if (newRating < 1 || newRating > 5) {
      Alert.alert('Lỗi', 'Vui lòng chọn điểm đánh giá từ 1 đến 5');
      return;
    }

    setSubmittingReview(true);

    try {
      const response = await postAccess(`dishes/${dishId}/reviews`, {
        rating: newRating,
        comment: newComment.trim(),
      });

      if (response?.success) {
        Alert.alert('Thành công', 'Đánh giá của bạn đã được gửi');
        setNewComment('');
        setNewRating(5);
        setShowReviewForm(false);

        // Reset pagination and refresh reviews
        setReviewsPage(1);
        await fetchReviews(1, false);

        const statsPayload = await getAccess(`dishes/${dishId}/reviews/stats`);
        if (statsPayload?.success && statsPayload.data) {
          setReviewStats(statsPayload.data);
        }
      } else {
        Alert.alert('Lỗi', response?.message || 'Không thể gửi đánh giá');
      }
    } catch (err: any) {
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        handleSessionExpired();
        return;
      }
      console.log(err);

      // Xử lý lỗi 409 - User đã đánh giá rồi
      const errorMessage = err?.response?.data?.message || err?.message || '';
      if (err?.response?.status === 409 || errorMessage.includes('đã đánh giá')) {
        Alert.alert(
          'Bạn đã đánh giá món ăn này rồi',
          'Vui lòng chỉnh sửa đánh giá hiện tại thay vì tạo mới.',
          [
            {
              text: 'OK',
              onPress: async () => {
                // Fetch lại user review
                try {
                  const payload = await getAccess(`dishes/${dishId}/reviews/my-review`);
                  if (payload?.success && payload.data) {
                    setUserReview(payload.data);
                    setNewRating(payload.data.rating);
                    setNewComment(payload.data.comment);
                    setIsEditingReview(true);
                  }
                } catch (e) {
                  console.log('Error fetching user review', e);
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('Lỗi', 'Không thể gửi đánh giá. Vui lòng thử lại.');
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (rating: number, size: number = 16) => {
    return (
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={size}
            color={star <= rating ? '#FFD700' : COLORS.grey}
          />
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={foodDetailStyles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={foodDetailStyles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.purple} />
          <Text style={foodDetailStyles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!dish) {
    return (
      <SafeAreaView style={foodDetailStyles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={foodDetailStyles.headerWrapper}>
          <View style={foodDetailStyles.header}>
            <TouchableOpacity onPress={handleBack} style={foodDetailStyles.headerButton}>
              <Ionicons name="arrow-back" size={22} color={COLORS.darkGrey} />
            </TouchableOpacity>
            <View style={foodDetailStyles.headerTitleGroup}>
              <Text style={foodDetailStyles.eyebrowLabel}>Chi tiết món ăn</Text>
            </View>
            <View style={foodDetailStyles.headerButtonPlaceholder} />
          </View>
        </View>
        <View style={foodDetailStyles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.grey} />
          <Text style={foodDetailStyles.errorText}>{error || 'Không tìm thấy món ăn'}</Text>
          <TouchableOpacity onPress={handleBack} style={foodDetailStyles.backButtonText}>
            <Text style={foodDetailStyles.backButtonTextLabel}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const descriptionSections = parseDescription(dish.description);
  const primaryDescription = descriptionSections.find((section) => section.type === 'text')?.content?.[0];
  const heroSummaryText =
    primaryDescription ||
    'Khám phá hương vị đặc trưng cùng công thức và đánh giá từ cộng đồng.';
  const recipeStepsCount = recipe?.steps?.length || 0;
  const heroStats: { icon: IconName; label: string; value: string }[] = [
    {
      icon: 'calendar-outline',
      label: 'Ngày tạo',
      value: formatDate(dish.created_at),
    },
    {
      icon: 'restaurant-outline',
      label: 'Công thức',
      value: recipeLoading
        ? 'Đang tải...'
        : recipeStepsCount > 0
          ? `${recipeStepsCount} bước`
          : 'Chưa cập nhật',
    },
    {
      icon: 'star-outline',
      label: 'Đánh giá',
      value: statsLoading
        ? 'Đang tải...'
        : reviewStats?.averageRating
          ? `${reviewStats.averageRating.toFixed(1)} ★`
          : 'Chưa có',
    },
  ];

  return (
    <SafeAreaView style={foodDetailStyles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={foodDetailStyles.headerWrapper}>
        <View style={foodDetailStyles.header}>
          <TouchableOpacity onPress={handleBack} style={foodDetailStyles.headerButton}>
            <Ionicons name="arrow-back" size={22} color={COLORS.darkGrey} />
          </TouchableOpacity>
          <View style={foodDetailStyles.headerTitleGroup}>
            <Text style={foodDetailStyles.eyebrowLabel}>Chi tiết món ăn</Text>
          </View>
          <TouchableOpacity onPress={handleShareDish} style={foodDetailStyles.headerButton}>
            <Ionicons name="share-social-outline" size={20} color={COLORS.darkGrey} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={foodDetailStyles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={foodDetailStyles.scrollContent}
      >
        {/* Image */}
        <View style={foodDetailStyles.imageContainer}>
          <View style={foodDetailStyles.imageBackdrop} />
          <View style={foodDetailStyles.imageCard}>
            {dish.image_url ? (
              <Image
                source={{ uri: dish.image_url }}
                style={foodDetailStyles.dishImage}
              />
            ) : (
              <View style={foodDetailStyles.imagePlaceholder}>
                <Ionicons name="restaurant" size={64} color={COLORS.grey} />
              </View>
            )}
          </View>
        </View>

        {/* Content */}
        <View style={foodDetailStyles.content}>
          <View style={foodDetailStyles.heroTitleCard}>
            <Text style={foodDetailStyles.eyebrowLabel}>Chi tiết món ăn</Text>
            <Text style={foodDetailStyles.title}>{dish.name}</Text>
            <View style={foodDetailStyles.metaChip}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.grey} />
              <Text style={foodDetailStyles.metaChipText}>
                {formatDate(dish.created_at)}
              </Text>
            </View>
            <Text style={foodDetailStyles.heroSummary} numberOfLines={3}>
              {heroSummaryText}
            </Text>
          </View>

          <View style={foodDetailStyles.heroStatsRow}>
            {heroStats.map((stat) => (
              <View key={stat.label} style={foodDetailStyles.heroStatCard}>
                <View style={foodDetailStyles.heroStatIcon}>
                  <Ionicons name={stat.icon} size={16} color={COLORS.purple} />
                </View>
                <Text style={foodDetailStyles.heroStatLabel}>{stat.label}</Text>
                <Text style={foodDetailStyles.heroStatValue}>{stat.value}</Text>
              </View>
            ))}
          </View>

          <View style={foodDetailStyles.sectionStack}>
            <View style={foodDetailStyles.sectionCard}>
              <TouchableOpacity
                style={foodDetailStyles.sectionCardHeader}
                onPress={() => setIsDescriptionExpanded((prev) => !prev)}
                activeOpacity={0.8}
              >
                <View style={foodDetailStyles.sectionCardTitleGroup}>
                  <Text style={foodDetailStyles.sectionCardTitle}>Nguyên liệu</Text>
                  <Text style={foodDetailStyles.sectionCardSubtitle}>
                    {isDescriptionExpanded ? 'Thu gọn danh sách' : 'Chạm để xem chi tiết'}
                  </Text>
                </View>
                <View style={foodDetailStyles.sectionCardIcon}>
                  <Ionicons
                    name={isDescriptionExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={COLORS.darkGrey}
                  />
                </View>
              </TouchableOpacity>

              {isDescriptionExpanded && (
                <>
                  <View style={foodDetailStyles.sectionDivider} />
                  {descriptionSections.map((section, index) => (
                    <View key={index} style={foodDetailStyles.descriptionSection}>
                      {section.type === 'list' ? (
                        <View style={foodDetailStyles.listContainer}>
                          {section.content.map((item, itemIndex) => (
                            <View key={itemIndex} style={foodDetailStyles.listItem}>
                              <View style={foodDetailStyles.listItemIcon}>
                                <Ionicons
                                  name="checkmark-outline"
                                  size={16}
                                  color={COLORS.purple}
                                />
                              </View>
                              <Text style={foodDetailStyles.listItemText}>
                                {item.substring(1).trim()}
                              </Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        section.content.map((text, textIndex) => (
                          <Text key={textIndex} style={foodDetailStyles.descriptionText}>
                            {text}
                          </Text>
                        ))
                      )}
                    </View>
                  ))}
                </>
              )}
            </View>

            <View style={foodDetailStyles.sectionCard}>
              <TouchableOpacity
                style={foodDetailStyles.sectionCardHeader}
                onPress={() => setIsRecipeExpanded((prev) => !prev)}
                activeOpacity={0.8}
              >
                <View style={foodDetailStyles.sectionCardTitleGroup}>
                  <Text style={foodDetailStyles.sectionCardTitle}>Công thức</Text>
                  <Text style={foodDetailStyles.sectionCardSubtitle}>
                    {isRecipeExpanded
                      ? 'Thu gọn các bước'
                      : recipeStepsCount > 0
                        ? `${recipeStepsCount} bước hướng dẫn`
                        : 'Chạm để xem chi tiết'}
                  </Text>
                </View>
                <View style={foodDetailStyles.sectionCardIcon}>
                  <Ionicons
                    name={isRecipeExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={COLORS.darkGrey}
                  />
                </View>
              </TouchableOpacity>

              {isRecipeExpanded && (
                <>
                  <View style={foodDetailStyles.sectionDivider} />

                  {recipeLoading && (
                    <View style={foodDetailStyles.infoRow}>
                      <ActivityIndicator size="small" color={COLORS.purple} />
                      <Text style={foodDetailStyles.loadingText}>Đang tải công thức...</Text>
                    </View>
                  )}

                  {!recipeLoading && recipeError && (
                    <Text style={foodDetailStyles.recipeError}>{recipeError}</Text>
                  )}

                  {!recipeLoading && recipe && recipe.steps && recipe.steps.length > 0 && (
                    <View style={foodDetailStyles.stepsContainer}>
                      {recipe.steps.map((step) => (
                        <View key={step.id} style={foodDetailStyles.stepCard}>
                          <View style={foodDetailStyles.stepBadge}>
                            <Text style={foodDetailStyles.stepBadgeText}>
                              Bước {step.step_number}
                            </Text>
                          </View>
                          <Text style={foodDetailStyles.stepDescription}>
                            {step.description || 'Chưa có mô tả cho bước này'}
                          </Text>
                          {/* Hiển thị images nếu có */}
                          {step.images && step.images.length > 0 && (
                            <ScrollView
                              horizontal
                              showsHorizontalScrollIndicator={false}
                              style={{ marginTop: 12 }}
                              contentContainerStyle={{ gap: 8, paddingRight: 8 }}
                            >
                              {step.images.map((image) => (
                                <Image
                                  key={image.id}
                                  source={{ uri: image.url }}
                                  style={{
                                    width: 120,
                                    height: 120,
                                    borderRadius: 8,
                                    backgroundColor: COLORS.lightGrey,
                                  }}
                                  resizeMode="cover"
                                />
                              ))}
                            </ScrollView>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>

            <View style={foodDetailStyles.sectionCard}>
              <TouchableOpacity
                style={foodDetailStyles.sectionCardHeader}
                onPress={() => setIsNutrientsExpanded((prev) => !prev)}
                activeOpacity={0.8}
              >
                <View style={foodDetailStyles.sectionCardTitleGroup}>
                  <Text style={foodDetailStyles.sectionCardTitle}>Dinh dưỡng</Text>
                  <Text style={foodDetailStyles.sectionCardSubtitle}>
                    {isNutrientsExpanded
                      ? 'Thu gọn danh sách'
                      : nutrients.length > 0
                        ? `${nutrients.length} chất dinh dưỡng`
                        : 'Chạm để xem chi tiết'}
                  </Text>
                </View>
                <View style={foodDetailStyles.sectionCardIcon}>
                  <Ionicons
                    name={isNutrientsExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={COLORS.darkGrey}
                  />
                </View>
              </TouchableOpacity>

              {isNutrientsExpanded && (
                <>
                  <View style={foodDetailStyles.sectionDivider} />

                  {nutrientsLoading && (
                    <View style={foodDetailStyles.infoRow}>
                      <ActivityIndicator size="small" color={COLORS.purple} />
                      <Text style={foodDetailStyles.loadingText}>Đang tải thông tin dinh dưỡng...</Text>
                    </View>
                  )}

                  {!nutrientsLoading && nutrientsError && (
                    <Text style={foodDetailStyles.recipeError}>{nutrientsError}</Text>
                  )}

                  {!nutrientsLoading && nutrients.length === 0 && !nutrientsError && (
                    <Text style={foodDetailStyles.emptyReviewsText}>
                      Chưa có thông tin dinh dưỡng cho món ăn này
                    </Text>
                  )}

                  {!nutrientsLoading && nutrients.length > 0 && (
                    <View style={foodDetailStyles.listContainer}>
                      {nutrients.map((nutrient) => (
                        <View key={nutrient.id} style={foodDetailStyles.listItem}>
                          <View style={foodDetailStyles.listItemIcon}>
                            <Ionicons
                              name="nutrition-outline"
                              size={16}
                              color={COLORS.purple}
                            />
                          </View>
                          <Text style={foodDetailStyles.listItemText}>
                            {nutrient.description}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>

            <View style={foodDetailStyles.sectionCard}>
              <TouchableOpacity
                style={foodDetailStyles.sectionCardHeader}
                onPress={() => setIsReviewsExpanded((prev) => !prev)}
                activeOpacity={0.8}
              >
                <View style={foodDetailStyles.sectionCardTitleGroup}>
                  <Text style={foodDetailStyles.sectionCardTitle}>Đánh giá</Text>
                  <Text style={foodDetailStyles.sectionCardSubtitle}>
                    {reviewStats?.totalReviews
                      ? `${reviewStats.totalReviews} đánh giá từ người dùng`
                      : 'Chạm để xem chi tiết'}
                  </Text>
                </View>
                <View style={foodDetailStyles.sectionCardIcon}>
                  <Ionicons
                    name={isReviewsExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={COLORS.darkGrey}
                  />
                </View>
              </TouchableOpacity>

              {isReviewsExpanded && (
                <>
                  <View style={foodDetailStyles.sectionDivider} />

                  {!statsLoading && reviewStats && (
                    <View style={foodDetailStyles.statsContainer}>
                      <View style={foodDetailStyles.statsRow}>
                        <View style={foodDetailStyles.statsItem}>
                          <Text style={foodDetailStyles.statsValue}>
                            {reviewStats.averageRating.toFixed(1)}
                          </Text>
                          <View style={foodDetailStyles.statsStars}>
                            {renderStars(Math.round(reviewStats.averageRating))}
                          </View>
                        </View>
                        <View style={foodDetailStyles.statsDivider} />
                        <View style={foodDetailStyles.statsItem}>
                          <Text style={foodDetailStyles.statsValue}>
                            {reviewStats.totalReviews}
                          </Text>
                          <Text style={foodDetailStyles.statsLabel}>Đánh giá</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Hiển thị review hiện tại của user nếu có */}
                  {userReview && !showReviewForm && (
                    <View style={foodDetailStyles.userReviewCard}>
                      <View style={foodDetailStyles.userReviewHeader}>
                        <Text style={foodDetailStyles.userReviewTitle}>Đánh giá của bạn</Text>
                        <View style={foodDetailStyles.userReviewActions}>
                          <TouchableOpacity
                            onPress={() => {
                              setNewRating(userReview.rating);
                              setNewComment(userReview.comment);
                              setIsEditingReview(true);
                              setShowReviewForm(true);
                            }}
                            style={foodDetailStyles.iconButton}
                          >
                            <Ionicons name="create-outline" size={20} color={COLORS.purple} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={foodDetailStyles.ratingDisplay}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons
                            key={star}
                            name={star <= userReview.rating ? 'star' : 'star-outline'}
                            size={20}
                            color={star <= userReview.rating ? '#FFD700' : COLORS.grey}
                          />
                        ))}
                      </View>
                      <Text style={foodDetailStyles.userReviewComment}>{userReview.comment}</Text>
                    </View>
                  )}

                  {/* Nút viết đánh giá - chỉ hiển thị nếu chưa có review */}
                  {!userReview && !showReviewForm && (
                    <TouchableOpacity
                      style={foodDetailStyles.addReviewButton}
                      onPress={() => {
                        setShowReviewForm(true);
                        setIsEditingReview(false);
                        setNewRating(5);
                        setNewComment('');
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="add-circle-outline" size={20} color={COLORS.purple} />
                      <Text style={foodDetailStyles.addReviewButtonText}>
                        Viết đánh giá
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Nút hủy khi đang mở form */}
                  {showReviewForm && (
                    <TouchableOpacity
                      style={[foodDetailStyles.addReviewButton, { backgroundColor: COLORS.lightGrey }]}
                      onPress={() => {
                        setShowReviewForm(false);
                        setIsEditingReview(false);
                        setNewRating(5);
                        setNewComment('');
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close-circle-outline" size={20} color={COLORS.darkGrey} />
                      <Text style={[foodDetailStyles.addReviewButtonText, { color: COLORS.darkGrey }]}>
                        Hủy
                      </Text>
                    </TouchableOpacity>
                  )}

                  {showReviewForm && (
                    <View style={foodDetailStyles.reviewForm}>
                      <Text style={foodDetailStyles.formLabel}>Đánh giá của bạn</Text>
                      <View style={foodDetailStyles.ratingSelector}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <TouchableOpacity
                            key={star}
                            onPress={() => setNewRating(star)}
                            activeOpacity={0.7}
                          >
                            <Ionicons
                              name={star <= newRating ? 'star' : 'star-outline'}
                              size={32}
                              color={star <= newRating ? '#FFD700' : COLORS.grey}
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                      <TextInput
                        style={foodDetailStyles.commentInput}
                        placeholder="Nhập bình luận của bạn..."
                        placeholderTextColor={COLORS.grey}
                        multiline
                        numberOfLines={4}
                        value={newComment}
                        onChangeText={setNewComment}
                        textAlignVertical="top"
                      />
                      <View style={foodDetailStyles.reviewFormActions}>
                        <TouchableOpacity
                          style={[
                            foodDetailStyles.submitButton,
                            submittingReview && foodDetailStyles.submitButtonDisabled,
                          ]}
                          onPress={isEditingReview ? handleUpdateReview : handleSubmitReview}
                          disabled={submittingReview}
                          activeOpacity={0.8}
                        >
                          {submittingReview ? (
                            <ActivityIndicator size="small" color={COLORS.white} />
                          ) : (
                            <Text style={foodDetailStyles.submitButtonText}>
                              {isEditingReview ? 'Cập nhật' : 'Gửi đánh giá'}
                            </Text>
                          )}
                        </TouchableOpacity>
                        {isEditingReview && (
                          <TouchableOpacity
                            style={foodDetailStyles.deleteButton}
                            onPress={handleDeleteReview}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                            <Text style={foodDetailStyles.deleteButtonText}>Xóa</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}

                  {reviewsLoading && (
                    <View style={foodDetailStyles.infoRow}>
                      <ActivityIndicator size="small" color={COLORS.purple} />
                      <Text style={foodDetailStyles.loadingText}>Đang tải đánh giá...</Text>
                    </View>
                  )}

                  {!reviewsLoading && reviewsError && (
                    <Text style={foodDetailStyles.recipeError}>{reviewsError}</Text>
                  )}

                  {!reviewsLoading && reviews.length === 0 && !reviewsError && (
                    <Text style={foodDetailStyles.emptyReviewsText}>
                      Chưa có đánh giá nào cho món ăn này
                    </Text>
                  )}

                  {!reviewsLoading && reviews.length > 0 && (
                    <>
                      <View style={foodDetailStyles.reviewsList}>
                        {reviews.map((review) => (
                          <View key={review.id} style={foodDetailStyles.reviewCard}>
                            <View style={foodDetailStyles.reviewHeader}>
                              <View style={foodDetailStyles.reviewUserInfo}>
                                {review.user?.avatar_url ? (
                                  <Image
                                    source={{ uri: review.user.avatar_url }}
                                    style={foodDetailStyles.avatar}
                                  />
                                ) : (
                                  <View style={foodDetailStyles.avatarPlaceholder}>
                                    <Ionicons name="person" size={20} color={COLORS.grey} />
                                  </View>
                                )}
                                <View style={foodDetailStyles.reviewUserDetails}>
                                  <Text style={foodDetailStyles.reviewUserName}>
                                    {review.user?.full_name || 'Người dùng'}
                                  </Text>
                                  <Text style={foodDetailStyles.reviewDate}>
                                    {formatDate(review.created_at)}
                                  </Text>
                                </View>
                              </View>
                              {renderStars(review.rating)}
                            </View>
                            {review.comment && (
                              <Text style={foodDetailStyles.reviewComment}>{review.comment}</Text>
                            )}
                          </View>
                        ))}
                      </View>

                      {reviewsHasMore && (
                        <TouchableOpacity
                          style={foodDetailStyles.loadMoreButton}
                          onPress={handleLoadMoreReviews}
                          disabled={reviewsLoadingMore}
                          activeOpacity={0.7}
                        >
                          {reviewsLoadingMore ? (
                            <>
                              <ActivityIndicator size="small" color={COLORS.purple} />
                              <Text style={foodDetailStyles.loadMoreButtonText}>Đang tải...</Text>
                            </>
                          ) : (
                            <>
                              <Ionicons name="chevron-down" size={20} color={COLORS.purple} />
                              <Text style={foodDetailStyles.loadMoreButtonText}>Xem thêm đánh giá</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Favorite FAB Button */}
      {!loading && dish && (
        <TouchableOpacity
          style={foodDetailStyles.favoriteFab}
          onPress={handleToggleFavorite}
          disabled={favoriteLoading}
          activeOpacity={0.8}
        >
          {favoriteLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={28}
              color={COLORS.white}
            />
          )}
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

