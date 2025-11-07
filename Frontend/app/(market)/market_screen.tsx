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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { commonStyles } from "@/styles/common.styles";
import { marketStyles } from "@/styles/market.styles";
import { ingredientPagination } from "@/service/market";
import { COLORS } from "@/constants/themes";

const categories = ["Thịt", "Cá", "Rau Củ", "Hải Sản"];

export default function MarketScreen() {
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [prev, setPrev] = useState(false)
  const [next, setNext] = useState(true)

  useEffect(() => {
    const handlePagination = async () => {
      try {
        setLoading(true);
        const res = await ingredientPagination({ page: currentPage, limit: 5 });

        if (res?.data) {
          setData(res.data);
          setTotalPages(res.pagination.totalPages); 
          setPrev(res.pagination.hasPrevPage)
          setNext(res.pagination.hasNextPage)
          console.log(prev, next)
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    handlePagination();
  }, [currentPage]);

  return (
    <View style={commonStyles.container}>
      {/* Header */}
      <View style={marketStyles.header}>
        <Text style={marketStyles.title}>Chợ nông sản</Text>
        <View style={marketStyles.iconGroup}>
          <Ionicons name="notifications-outline" size={22} color="black" />
          <Ionicons name="person-circle-outline" size={28} color="black" />
        </View>
      </View>

      {/* Search Bar */}
      <View style={marketStyles.searchContainer}>
        <Ionicons name="search" size={20} color="#aaa" />
        <TextInput placeholder="Tìm kiếm sản phẩm" style={marketStyles.searchInput} />
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginVertical: 10, marginLeft: 10, height: 'auto' }}
      >
        {categories.map((cat, index) => (
          <TouchableOpacity key={index} style={marketStyles.categoryBtn}>
            <Text style={{ color: COLORS.primary }}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Product List */}
      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={data}
          numColumns={2}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={marketStyles.card}>
              <Image source={{ uri: item.image_url }} style={marketStyles.image} />
              <Text style={marketStyles.name}>{item.name}</Text>
              <Text style={marketStyles.price}>{parseInt(item.price).toLocaleString()} VND</Text>
              <TouchableOpacity style={marketStyles.addBtn}>
                <Text style={marketStyles.addText}>Thêm vào giỏ</Text>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}

      {/* Pagination */}
     <View style={marketStyles.paginationContainer}>
      {/* Nút Prev */}
      <TouchableOpacity
        onPress={() => setCurrentPage(currentPage - 1)}
        disabled={!prev}
        style={[
          marketStyles.pageButton,
          currentPage === 1 && { opacity: 0.5 }, // làm mờ khi disable
        ]}
      >
        <Text style={{ color: "#333", fontWeight: "500" }}>Prev</Text>
      </TouchableOpacity>

     
  {/* Logic hiển thị trang */}
  {(() => {
    const pages: (number | string)[] = [];

    // Nếu tổng trang <= 6, hiển thị tất cả
    if (totalPages <= 6) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        // Luôn có trang 1
        pages.push(1);

        // Nếu ở gần đầu
        if (currentPage <= 3) {
          pages.push(2, 3, 4, "...", totalPages);
        }
        // Nếu ở gần cuối
        else if (currentPage >= totalPages - 2) {
          pages.push("...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        }
        // Nếu ở giữa
        else {
          pages.push("...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
        }
      }

      return pages.map((page, index) => {
        if (page === "...") {
          return (
            <Text key={`dot-${index}`} style={{ marginHorizontal: 6, color: "#999" }}>
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
            <Text
              style={{
                color: currentPage === page ? "#fff" : "#333",
                fontWeight: "500",
              }}
            >
              {page}
            </Text>
          </TouchableOpacity>
        );
      });
    })()}

      {/* Nút Next */}
      <TouchableOpacity
        onPress={() => setCurrentPage(currentPage + 1)}
        disabled={!next}
        style={[
          marketStyles.pageButton,
          currentPage === totalPages && { opacity: 0.5 },
        ]}
      >
        <Text style={{ color: "#333", fontWeight: "500" }}>Next</Text>
      </TouchableOpacity>
    </View>

    </View>
  );
}
