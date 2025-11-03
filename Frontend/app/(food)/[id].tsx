import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS } from '../../constants/themes';
import { foodDetailStyles } from '../../styles/foodDetail.styles';

// Interface cho món ăn
interface Dish {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  created_at: string;
}

// Dữ liệu mẫu - sẽ được thay thế bằng API call
const mockDishData: Dish[] = [
  {
    id: "2357",
    name: "Cháo thịt gà 🍗 rau cải 🥬",
    description: "Nguồn: https://cookpad.com/vn/cong-thuc/17146511\nNguyên liệu:\n- 25 g gạo\n- 15 g thịt gà\n- 15 g rau cải",
    image_url: null,
    created_at: "2025-10-24T23:09:12.000Z"
  },
  {
    id: "2356",
    name: "Cá ót nấu rau cần",
    description: "Nguồn: https://cookpad.com/vn/cong-thuc/17179340\nNguyên liệu:\n- 0,5 kg cá ót\n- 1 mớ rau cần\n- 3 quả cà chua\n- 2 quả me (hoặc mẻ,khế...)\n- Hành, răm,thìa là,gừng,hành khô, tỏi,giavị",
    image_url: "https://img-global.cpcdn.com/steps/aa574445fc94586c/160x128cq80/ca-ot-n%E1%BA%A5u-rau-c%E1%BA%A7n-recipe-step-5-photo.jpg",
    created_at: "2025-10-24T23:09:11.000Z"
  },
  {
    id: "2355",
    name: "Canh rau ngót Nhật thịt bằm",
    description: "Thời gian nấu: 20 phút\nKhẩu phần: 2-3 người\nNguồn: https://cookpad.com/vn/cong-thuc/17197031\nNguyên liệu:\n- 1 bó rau ngót Nhật\n- 200 gr thịt nạc xay\n- 2 muỗng canh hạt nêm\n- 2 củ hành tím\n- 2 muỗng canh dầu ăn\n- 1 bát nước",
    image_url: "https://img-global.cpcdn.com/steps/c7c75a39423f8395/160x128cq80/canh-rau-ngot-nh%E1%BA%ADt-th%E1%BB%8Bt-b%E1%BA%B1m-recipe-step-3-photo.jpg",
    created_at: "2025-10-24T23:09:10.000Z"
  },
  {
    id: "2354",
    name: "Gà nướng táo và rau củ",
    description: "Thời gian nấu: 60 phút\nKhẩu phần: 6 người\nNguồn: https://cookpad.com/vn/cong-thuc/17198541\nNguyên liệu:\n- 2 cái đùi gàgóc tư\n- 1 quả táo\n- 1/2 củ cà rốt\n- 1/2 củ hành tây\n- Ít bông cải\n- 1 củ tỏi,\n- Ít cà chua bi socola\n- Lá hương thảo\n- Giavị",
    image_url: "https://img-global.cpcdn.com/steps/833cefe783df5d1f/160x128cq80/ga-n%C6%B0%E1%BB%9Bng-tao-va-rau-c%E1%BB%A7-recipe-step-4-photo.jpg",
    created_at: "2025-10-24T23:09:08.000Z"
  },
  {
    id: "2353",
    name: "Súp táo hầm rau củ đông trùng hạ thảo",
    description: "Thời gian nấu: 60 phút\nKhẩu phần: 4 người\nNguồn: https://cookpad.com/vn/cong-thuc/17198560\nNguyên liệu:\n- 1 kg sườn\n- 2 trái táo\n- 1 trái bắp\n- 1 bịch nấm đông cô\n- 100 g hạt sen\n- Ít đông trùng hạ thảo\n- Ít táo tàu\n- 1 bịch nấm linh chi trắng\n- 2 củ hành tím\n- Giavị",
    image_url: "https://img-global.cpcdn.com/steps/0e7cd8f621e26935/160x128cq80/sup-tao-h%E1%BA%A7m-rau-c%E1%BB%A7-dong-trung-h%E1%BA%A1-th%E1%BA%A3o-recipe-step-3-photo.jpg",
    created_at: "2025-10-24T23:09:07.000Z"
  }
];

export default function FoodDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [dish, setDish] = useState<Dish | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call - sẽ thay thế bằng API call thật
    const fetchDish = async () => {
      setLoading(true);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Tìm món ăn trong mock data
      const foundDish = mockDishData.find(d => d.id === id);
      setDish(foundDish || null);
      setLoading(false);
    };

    if (id) {
      fetchDish();
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
          <Text style={foodDetailStyles.errorText}>Không tìm thấy món ăn</Text>
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
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Header */}
      <View style={foodDetailStyles.header}>
        <TouchableOpacity onPress={handleBack} style={foodDetailStyles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={foodDetailStyles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Image */}
        <View style={foodDetailStyles.imageContainer}>
          {dish.image_url ? (
            <Image 
              source={{ uri: dish.image_url }} 
              style={foodDetailStyles.dishImage}
              resizeMode="cover"
            />
          ) : (
            <View style={foodDetailStyles.imagePlaceholder}>
              <Ionicons name="restaurant" size={64} color={COLORS.grey} />
            </View>
          )}
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
            <Text style={foodDetailStyles.sectionTitle}>Mô tả</Text>
            {descriptionSections.map((section, index) => (
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

