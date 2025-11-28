import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  BackHandler,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { commonStyles } from "@/styles/common.styles";
import { marketStyles } from "@/styles/market.styles";
import { ingredientPagination, searchIngredients } from "@/service/market";
import { COLORS } from "@/constants/themes";

// Mapping category names to IDs (có thể lấy từ API sau)
const categoryMap: { [key: string]: number } = {
  "Thịt": 1,
  "Rau củ": 2,
  "Hoa quả": 3,
  "Tôm Ốc": 4,
  "Cá": 5,
};

const categories = ["Thịt", "Rau củ", "Hoa quả", "Tôm Ốc", "Cá"];

export default function MarketScreen() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [prev, setPrev] = useState(false);
  const [next, setNext] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  const handleSessionExpired = () => {
    Alert.alert('Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại');
    router.replace('/(auth)/login');
  };

  // Xử lý nút back trên điện thoại - quay về home
  useEffect(() => {
    const backAction = () => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.push('/(home)');
      }
      return true; // Ngăn hành vi mặc định (không hiện thông báo thoát)
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1);
    }, 500); 

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let res;

        if (debouncedSearchQuery.trim() || selectedCategory) {
          const searchParams: any = {
            page: currentPage,
            limit: 8,
          };

          if (debouncedSearchQuery.trim()) {
            searchParams.name = debouncedSearchQuery.trim();
          }

          if (selectedCategory && categoryMap[selectedCategory]) {
            searchParams.category_id = categoryMap[selectedCategory];
          }

          res = await searchIngredients(searchParams);
        } else {
          res = await ingredientPagination({ page: currentPage, limit: 8 });
        }

        if (res?.data) {
          setData(res.data);
          setTotalPages(res.pagination?.totalPages || 1);
          setPrev(res.pagination?.hasPrevPage || false);
          setNext(res.pagination?.hasNextPage || false);
        }
      } catch (e: any) {
        console.error("Error fetching data:", e);
        if (e?.message === 'SESSION_EXPIRED' || e?.response?.status === 401) {
          handleSessionExpired();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, debouncedSearchQuery, selectedCategory]);

  const onRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    try {
      let res;
      
      if (debouncedSearchQuery.trim() || selectedCategory) {
        const searchParams: any = {
          page: 1,
          limit: 8,
        };

        if (debouncedSearchQuery.trim()) {
          searchParams.name = debouncedSearchQuery.trim();
        }

        if (selectedCategory && categoryMap[selectedCategory]) {
          searchParams.category_id = categoryMap[selectedCategory];
        }

        res = await searchIngredients(searchParams);
      } else {
        res = await ingredientPagination({ page: 1, limit: 8 });
      }

      if (res?.data) {
        setData(res.data);
        setTotalPages(res.pagination?.totalPages || 1);
        setPrev(res.pagination?.hasPrevPage || false);
        setNext(res.pagination?.hasNextPage || false);
      }
    } catch (e: any) {
      console.error(e);
      if (e?.message === 'SESSION_EXPIRED' || e?.response?.status === 401) {
        handleSessionExpired();
      }
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={marketStyles.safeArea}>
      <View style={marketStyles.container}>
    
        <View style={marketStyles.header}>
          <View style={marketStyles.headerTop}>
            <TouchableOpacity 
              style={marketStyles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.darkGrey} />
            </TouchableOpacity>
            <View style={marketStyles.headerContent}>
              <Text style={marketStyles.title}>Chợ của người Việt</Text>
            </View>
            <View style={marketStyles.iconGroup}>
              <TouchableOpacity style={marketStyles.iconButton}>
                <Ionicons name="notifications-outline" size={24} color={COLORS.darkGrey} />
                <View style={marketStyles.badge} />
              </TouchableOpacity>
              <TouchableOpacity style={marketStyles.iconButton}>
                <Ionicons name="person-circle-outline" size={28} color={COLORS.darkGrey} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

   
        <View style={marketStyles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.grey} style={marketStyles.searchIcon} />
          <TextInput 
            placeholder="Tìm kiếm sản phẩm..." 
            placeholderTextColor={COLORS.grey}
            style={marketStyles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color={COLORS.grey} />
            </TouchableOpacity>
          )}
        </View>


        <View style={marketStyles.categoriesWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={marketStyles.categoriesContainer}
          >
          <TouchableOpacity 
            key="all"
            style={[
              marketStyles.categoryBtn,
              selectedCategory === null && marketStyles.categoryBtnActive
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[
              marketStyles.categoryText,
              selectedCategory === null && marketStyles.categoryTextActive
            ]}>Tất cả</Text>
          </TouchableOpacity>
          {categories.map((cat, index) => (
            <TouchableOpacity 
              key={index} 
              style={[
                marketStyles.categoryBtn,
                selectedCategory === cat && marketStyles.categoryBtnActive
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[
                marketStyles.categoryText,
                selectedCategory === cat && marketStyles.categoryTextActive
              ]}>{cat}</Text>
            </TouchableOpacity>
          ))}
          </ScrollView>
        </View>

  
        {loading && !refreshing ? (
          <View style={marketStyles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={marketStyles.loadingText}>Đang tải sản phẩm...</Text>
          </View>
        ) : data.length === 0 ? (
          <View style={marketStyles.emptyContainer}>
            <Ionicons name="basket-outline" size={64} color={COLORS.grey} />
            <Text style={marketStyles.emptyText}>Không có sản phẩm nào</Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <FlatList
              data={data}
              numColumns={2}
              keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={marketStyles.card} 
                activeOpacity={0.8}
                onPress={() => router.push({
                  pathname: '/(market)/ingredient-detail',
                  params: { id: item.id.toString() }
                })}
              >
                  <View style={marketStyles.imageContainer}>
                    <Image 
                      source={{ uri: item.image_url || 'https://via.placeholder.com/150' }} 
                      style={marketStyles.image}
                      defaultSource={require('../../assets/images/logo.png')}
                    />
                    <View style={marketStyles.favoriteButton}>
                      <Ionicons name="heart-outline" size={18} color={COLORS.darkGrey} />
                    </View>
                  </View>
                  <View style={marketStyles.cardContent}>
                    <Text style={marketStyles.name} numberOfLines={2}>{item.name}</Text>
                    <Text style={marketStyles.price}>
                      {item.price ? parseInt(item.price).toLocaleString('vi-VN') : '0'} ₫
                    </Text>
                    <TouchableOpacity 
                      style={marketStyles.addBtn}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="cart-outline" size={16} color={COLORS.white} />
                      <Text style={marketStyles.addText}>Thêm vào giỏ</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )}
              contentContainerStyle={marketStyles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
              }
              showsVerticalScrollIndicator={false}
            />
            

            {totalPages > 1 && (
              <View style={marketStyles.paginationContainerFixed}>
                <TouchableOpacity
                  onPress={() => setCurrentPage(currentPage - 1)}
                  disabled={!prev}
                  style={[
                    marketStyles.pageButton,
                    marketStyles.pageButtonNav,
                    !prev && marketStyles.pageButtonDisabled,
                  ]}
                >
                  <Ionicons 
                    name="chevron-back" 
                    size={18} 
                    color={prev ? COLORS.darkGrey : COLORS.grey} 
                  />
                </TouchableOpacity>

                {(() => {
                  const pages: (number | string)[] = [];

                  if (totalPages <= 6) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    if (currentPage <= 3) {
                      pages.push(2, 3, 4, "...", totalPages);
                    } else if (currentPage >= totalPages - 2) {
                      pages.push("...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                    } else {
                      pages.push("...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
                    }
                  }

                  return pages.map((page, index) => {
                    if (page === "...") {
                      return (
                        <Text key={`dot-${index}`} style={marketStyles.pageDots}>
                          ...
                        </Text>
                      );
                    }

                    return (
                      <TouchableOpacity
                        key={page}
                        onPress={() => setCurrentPage(page as number)}
                        style={[
                          marketStyles.pageButton,
                          currentPage === page && marketStyles.activePage,
                        ]}
                      >
                        <Text style={[
                          marketStyles.pageButtonText,
                          currentPage === page && marketStyles.activePageText
                        ]}>
                          {page}
                        </Text>
                      </TouchableOpacity>
                    );
                  });
                })()}

                <TouchableOpacity
                  onPress={() => setCurrentPage(currentPage + 1)}
                  disabled={!next}
                  style={[
                    marketStyles.pageButton,
                    marketStyles.pageButtonNav,
                    !next && marketStyles.pageButtonDisabled,
                  ]}
                >
                  <Ionicons 
                    name="chevron-forward" 
                    size={18} 
                    color={next ? COLORS.darkGrey : COLORS.grey} 
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
