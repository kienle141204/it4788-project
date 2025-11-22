import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Image, ActivityIndicator, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS } from '../../constants/themes';
import { foodDetailStyles } from '../../styles/foodDetail.styles';
import { get, post } from '../../utils/api';

interface Dish {
  id: string | number;
  name: string;
  description: string;
  image_url: string | null;
  created_at: string;
}

interface RecipeStep {
  id: string | number;
  step_number: number;
  description: string;
}

interface Recipe {
  id: string | number;
  dish_id: string | number;
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

export default function FoodDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
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
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    const fetchDish = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await get(`dishes/get-info-dish-by-id/${id}`);
        const payload = response?.data;

        if (!payload?.success) {
          throw new Error(payload?.message || 'Không thể tải thông tin món ăn');
        }

        if (payload.data) {
          setDish(payload.data);
        } else {
          setDish(null);
          setError('Không tìm thấy món ăn');
        }
      } catch (err) {
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
        const response = await get(`recipes/by-dish/${id}`);
        const payload = response?.data;

        if (!payload?.success) {
          throw new Error(payload?.message || 'Không thể tải công thức');
        }

        const firstRecipe = Array.isArray(payload.data) ? payload.data[0] : null;

        if (firstRecipe) {
          setRecipe(firstRecipe);
        } else {
          setRecipe(null);
          setRecipeError('Chưa có công thức cho món ăn này');
        }
      } catch (err) {
        console.log(err);
        setRecipe(null);
        setRecipeError('Không thể tải công thức. Vui lòng thử lại.');
      } finally {
        setRecipeLoading(false);
      }
    };

    const fetchReviews = async () => {
      setReviewsLoading(true);
      setReviewsError(null);

      try {
        const response = await get(`dishes/${id}/reviews`);
        const payload = response?.data;

        if (!payload?.success) {
          throw new Error(payload?.message || 'Không thể tải đánh giá');
        }

        if (Array.isArray(payload.data)) {
          setReviews(payload.data);
        } else {
          setReviews([]);
        }
      } catch (err) {
        console.log(err);
        setReviews([]);
        setReviewsError('Không thể tải đánh giá. Vui lòng thử lại.');
      } finally {
        setReviewsLoading(false);
      }
    };

    const fetchReviewStats = async () => {
      setStatsLoading(true);

      try {
        const response = await get(`dishes/${id}/reviews/stats`);
        const payload = response?.data;

        if (payload?.success && payload.data) {
          setReviewStats(payload.data);
        } else {
          setReviewStats(null);
        }
      } catch (err) {
        console.log(err);
        setReviewStats(null);
      } finally {
        setStatsLoading(false);
      }
    };

    if (id) {
      fetchDish();
      fetchRecipe();
      fetchReviews();
      fetchReviewStats();
    }
  }, [id]);

  const handleBack = () => {
    router.back();
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
      const response = await post(`dishes/${id}/reviews`, {
        rating: newRating,
        comment: newComment.trim(),
      });

      if (response?.success) {
        Alert.alert('Thành công', 'Đánh giá của bạn đã được gửi');
        setNewComment('');
        setNewRating(5);
        setShowReviewForm(false);
        
        // Refresh reviews and stats
        const reviewsResponse = await get(`dishes/${id}/reviews`);
        const reviewsPayload = reviewsResponse?.data;
        if (reviewsPayload?.success && Array.isArray(reviewsPayload.data)) {
          setReviews(reviewsPayload.data);
        }

        const statsResponse = await get(`dishes/${id}/reviews/stats`);
        const statsPayload = statsResponse?.data;
        if (statsPayload?.success && statsPayload.data) {
          setReviewStats(statsPayload.data);
        }
      } else {
        Alert.alert('Lỗi', response?.message || 'Không thể gửi đánh giá');
      }
    } catch (err) {
      console.log(err);
      Alert.alert('Lỗi', 'Không thể gửi đánh giá. Vui lòng thử lại.');
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
        <View style={foodDetailStyles.header}>
          <TouchableOpacity onPress={handleBack} style={foodDetailStyles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.darkGrey} />
          </TouchableOpacity>
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

  return (
    <SafeAreaView style={foodDetailStyles.container} edges={['top']}>
      
      <View>
        <View style={foodDetailStyles.header}>
          <TouchableOpacity onPress={handleBack} style={foodDetailStyles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.darkGrey} />
          </TouchableOpacity>
          <Text style={foodDetailStyles.headerTitle}>Product Details</Text>
          <View style={foodDetailStyles.headerSpacer} />
        </View>
      </View>

      <ScrollView 
        style={foodDetailStyles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={foodDetailStyles.scrollContent}
      >
        {/* Image */}
        <View style={foodDetailStyles.imageContainer}>
          <View style={foodDetailStyles.imageCard}>
            {dish.image_url ? (
              <Image 
                source={{ uri: dish.image_url }} 
                style={foodDetailStyles.dishImage}
                resizeMode="contain"
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
          {/* Title */}
          <Text style={foodDetailStyles.title}>{dish.name}</Text>

          {/* Date */}
          <View style={foodDetailStyles.dateContainer}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.grey} />
            <Text style={foodDetailStyles.dateText}>
              {formatDate(dish.created_at)}
            </Text>
          </View>

          {/* Description */}
          <View style={foodDetailStyles.descriptionContainer}>
            <TouchableOpacity 
              style={foodDetailStyles.sectionHeader}
              onPress={() => setIsDescriptionExpanded(prev => !prev)}
              activeOpacity={0.8}
            >
              <Text style={foodDetailStyles.sectionTitle}>Nguyên liệu</Text>
              <Ionicons 
                name={isDescriptionExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={COLORS.grey}
              />
            </TouchableOpacity>

            {isDescriptionExpanded && descriptionSections.map((section, index) => (
              <View key={index} style={foodDetailStyles.descriptionSection}>
                {section.type === 'list' ? (
                  <View style={foodDetailStyles.listContainer}>
                    {section.content.map((item, itemIndex) => (
                      <View key={itemIndex} style={foodDetailStyles.listItem}>
                        <View style={foodDetailStyles.bulletPoint} />
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
          </View>

          <View style={foodDetailStyles.recipeContainer}>
            <TouchableOpacity
              style={foodDetailStyles.sectionHeader}
              onPress={() => setIsRecipeExpanded(prev => !prev)}
              activeOpacity={0.8}
            >
              <Text style={foodDetailStyles.sectionTitle}>Công thức</Text>
              <Ionicons 
                name={isRecipeExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={COLORS.grey}
              />
            </TouchableOpacity>

            {isRecipeExpanded && (
              <>
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
                    {recipe.steps.map(step => (
                      <View key={step.id} style={foodDetailStyles.stepCard}>
                        <Text style={foodDetailStyles.stepNumber}>
                          Bước {step.step_number}
                        </Text>
                        <Text style={foodDetailStyles.stepDescription}>
                          {step.description || 'Chưa có mô tả cho bước này'}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>

          {/* Reviews Section */}
          <View style={foodDetailStyles.reviewsContainer}>
            <TouchableOpacity
              style={foodDetailStyles.sectionHeader}
              onPress={() => setIsReviewsExpanded(prev => !prev)}
              activeOpacity={0.8}
            >
              <Text style={foodDetailStyles.sectionTitle}>Đánh giá</Text>
              <Ionicons 
                name={isReviewsExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={COLORS.grey}
              />
            </TouchableOpacity>

            {isReviewsExpanded && (
              <>
                {/* Review Stats */}
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

                {/* Add Review Button */}
                <TouchableOpacity
                  style={foodDetailStyles.addReviewButton}
                  onPress={() => setShowReviewForm(prev => !prev)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle-outline" size={20} color={COLORS.purple} />
                  <Text style={foodDetailStyles.addReviewButtonText}>
                    {showReviewForm ? 'Hủy đánh giá' : 'Viết đánh giá'}
                  </Text>
                </TouchableOpacity>

                {/* Review Form */}
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
                    <TouchableOpacity
                      style={[
                        foodDetailStyles.submitButton,
                        submittingReview && foodDetailStyles.submitButtonDisabled
                      ]}
                      onPress={handleSubmitReview}
                      disabled={submittingReview}
                      activeOpacity={0.8}
                    >
                      {submittingReview ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                      ) : (
                        <Text style={foodDetailStyles.submitButtonText}>Gửi đánh giá</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {/* Reviews List */}
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
                  <View style={foodDetailStyles.reviewsList}>
                    {reviews.map(review => (
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
                )}
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

