import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../constants/themes';
import { foodStyles } from '../../styles/food.styles';
import FoodCard from '../../components/FoodCard';

export default function FoodPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'explore' | 'mine'>('explore');
  const [searchQuery, setSearchQuery] = useState('');

  const handleBack = () => {
    router.back();
  };

  const handleNotificationPress = () => {
    // Handle notification press
    console.log('Notification pressed');
  };

  // Sample food data - sẽ được thay thế bằng API call
  const foodItems = [
    {
      id: '2357',
      name: 'Cháo thịt gà 🍗 rau cải 🥬',
      rating: '',
      image_url: null
    },
    {
      id: '2356',
      name: 'Cá ót nấu rau cần',
      rating: '',
      image_url: 'https://img-global.cpcdn.com/steps/aa574445fc94586c/160x128cq80/ca-ot-n%E1%BA%A5u-rau-c%E1%BA%A7n-recipe-step-5-photo.jpg'
    },
    {
      id: '2355',
      name: 'Canh rau ngót Nhật thịt bằm',
      rating: '',
      image_url: 'https://img-global.cpcdn.com/steps/c7c75a39423f8395/160x128cq80/canh-rau-ngot-nh%E1%BA%ADt-th%E1%BB%8Bt-b%E1%BA%B1m-recipe-step-3-photo.jpg'
    },
    {
      id: '2354',
      name: 'Gà nướng táo và rau củ',
      rating: '',
      image_url: 'https://img-global.cpcdn.com/steps/833cefe783df5d1f/160x128cq80/ga-n%C6%B0%E1%BB%9Bng-tao-va-rau-c%E1%BB%A7-recipe-step-4-photo.jpg'
    },
  ];

  const handleFoodPress = (id: string) => {
    router.push(`/(food)/${id}` as any);
  };

  return (
    <SafeAreaView style={foodStyles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={foodStyles.header}>
        <TouchableOpacity onPress={handleBack} style={foodStyles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.darkGrey} />
        </TouchableOpacity>
        
        <Text style={foodStyles.headerTitle}>Món ăn</Text>
        
        <TouchableOpacity 
          onPress={handleNotificationPress} 
          style={foodStyles.notificationButton}
        >
          <Ionicons name="notifications-outline" size={24} color={COLORS.darkGrey} />
          <View style={foodStyles.notificationDot} />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={foodStyles.tabContainer}>
        <TouchableOpacity
          style={[
            foodStyles.tab,
            activeTab === 'explore' ? foodStyles.tabActive : foodStyles.tabInactive
          ]}
          onPress={() => setActiveTab('explore')}
        >
          <Text
            style={[
              activeTab === 'explore' ? foodStyles.tabTextActive : foodStyles.tabTextInactive
            ]}
          >
            Khám phá
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            foodStyles.tab,
            activeTab === 'mine' ? foodStyles.tabActive : foodStyles.tabInactive
          ]}
          onPress={() => setActiveTab('mine')}
        >
          <Text
            style={[
              activeTab === 'mine' ? foodStyles.tabTextActive : foodStyles.tabTextInactive
            ]}
          >
            Của tôi
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={foodStyles.searchContainer}>
        <View style={foodStyles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.darkGrey} style={foodStyles.searchIcon} />
          <TextInput
            style={foodStyles.searchInput}
            placeholder="Search Anything"
            placeholderTextColor={COLORS.darkGrey}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={foodStyles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={foodStyles.scrollContent}
      >
        {activeTab === 'explore' && (
          <>         
            <View style={foodStyles.foodList}>
              {foodItems.map((item) => (
                <FoodCard 
                  key={item.id} 
                  id={item.id}
                  name={item.name} 
                  rating={item.rating}
                  image_url={item.image_url}
                  onPress={handleFoodPress}
                />
              ))}
            </View>
          </>
        )}

        {activeTab === 'mine' && (
          <View style={foodStyles.emptyState}>
            <Text style={foodStyles.emptyStateText}>Chưa có món ăn nào</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

