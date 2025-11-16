import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Platform } from 'react-native';
import { BackHandler, ToastAndroid } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Import components
import Header from '../../components/Header';
import TaskSummaryCard from '../../components/TaskSummaryCard';
import NotificationCard from '../../components/NotificationCard';
import FeatureGrid from '../../components/FeatureGrid';
import BottomNavigation from '../../components/BottomNavigation';
import { COLORS } from '../../constants/themes';

export default function HomePage() {
  const router = useRouter();
  const backPressCount = useRef(0);
  const [activeTab, setActiveTab] = useState('home');

  console.log('🏠 Đang ở HOME');

  useEffect(() => {
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
    return () => backHandler.remove();
  }, []);

  // Sample data
  const features = [
    { id: 'group', name: 'Nhóm', icon: 'people' as const, color: COLORS.purple, onPress: () => Alert.alert('Nhóm', 'Chức năng nhóm') },
    { id: 'shopping', name: 'Mua sắm', icon: 'document-text' as const, color: COLORS.purple, onPress: () => router.push('/(market)/market_screen') },
    { id: 'meals', name: 'Bữa ăn', icon: 'restaurant' as const, color: COLORS.purple, onPress: () => Alert.alert('Bữa ăn', 'Chức năng bữa ăn') },
    { id: 'nutrition', name: 'Dinh dưỡng', icon: 'book' as const, color: COLORS.orange, onPress: () => Alert.alert('Dinh dưỡng', 'Chức năng dinh dưỡng') },
    { id: 'personal', name: 'Cá nhân', icon: 'person' as const, color: COLORS.purple, onPress: () => Alert.alert('Cá nhân', 'Chức năng cá nhân') },
    { id: 'recipes', name: 'Công thức', icon: 'book' as const, color: COLORS.orange, onPress: () => Alert.alert('Công thức', 'Chức năng công thức') }
  ];

  const handleGoToMarket = () => {
    router.push('/(market)/market_screen');
  };

  const handleNotificationPress = () => {
    Alert.alert('Thông báo', 'Bạn có 6 thông báo mới');
  };

  const handleMenuPress = () => {
    Alert.alert('Menu', 'Menu tùy chọn');
  };

  const handleViewTasks = () => {
    Alert.alert('Nhiệm vụ', 'Xem danh sách nhiệm vụ');
  };

  const handleTabPress = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'add') {
      Alert.alert('Thêm mới', 'Tạo nội dung mới');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        <Header
          userName="Livia Vaccaro"
          onNotificationPress={handleNotificationPress}
          onMenuPress={handleMenuPress}
        />


        <TaskSummaryCard
          totalTasks={10}
          onViewTasks={handleViewTasks}
        />

   
        <View style={styles.notificationSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Notification</Text>
            <Ionicons name="sparkles" size={20} color={COLORS.purple} />
          </View>
          
          <NotificationCard
            title="Thông báo quan trọng"
            message="Thực phẩm hết hạn hay gì đó (thông báo quan trọng)"
            progress={75}
          />
        </View>

        {/* Features Grid */}
        <View style={styles.featuresSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Chức năng</Text>
            <Ionicons name="sparkles" size={20} color={COLORS.purple} />
          </View>
          <FeatureGrid features={features} />
        </View>
      </ScrollView>

  
      <BottomNavigation
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />
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
    fontWeight: '600',
    color: COLORS.darkGrey,
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
});