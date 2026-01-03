import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { COLORS } from '../constants/themes';

type CompletionStatus = 'incomplete' | 'partial' | 'complete';

interface TaskSummaryCardProps {
  totalTasks: number;
  completedTasks: number;
  onViewTasks: () => void;
}

// Hàm để lấy màu nền dựa trên trạng thái hoàn thành
const getBackgroundColor = (totalTasks: number, completedTasks: number): string => {
  if (totalTasks === 0) return COLORS.purple; // Không có nhiệm vụ

  const completionRate = completedTasks / totalTasks;

  if (completionRate >= 1) {
    return '#10B981'; // Xanh lá - hoàn thành hết
  } else if (completionRate >= 0.5) {
    return '#F59E0B'; // Vàng - hoàn thành > 50%
  } else {
    return '#EF4444'; // Đỏ - chưa hoàn thành > 50%
  }
};

// Hàm để lấy text mô tả trạng thái
const getStatusText = (totalTasks: number, completedTasks: number): string => {
  if (totalTasks === 0) return 'Không có nhiệm vụ';

  const completionRate = completedTasks / totalTasks;

  if (completionRate >= 1) {
    return 'Đã hoàn thành tất cả!';
  } else if (completionRate >= 0.5) {
    return `Còn ${totalTasks - completedTasks} mặt hàng`;
  } else {
    return `Còn ${totalTasks - completedTasks} mặt hàng cần mua`;
  }
};

export default function TaskSummaryCard({ totalTasks, completedTasks, onViewTasks }: TaskSummaryCardProps) {
  const backgroundColor = getBackgroundColor(totalTasks, completedTasks);
  const statusText = getStatusText(totalTasks, completedTasks);
  const remaining = totalTasks - completedTasks;

  // Animation values - start with visible to avoid flicker
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);

  const animateIn = () => {
    opacity.value = 0;
    translateX.value = -30;
    opacity.value = withTiming(1, { duration: 500 });
    translateX.value = withSpring(0, { damping: 15, stiffness: 100 });
  };

  useEffect(() => {
    animateIn();
  }, []);

  // Re-animate when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      animateIn();
    }, [])
  );

  // Animated style
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[{
      marginHorizontal: 20,
      marginBottom: 20,
      backgroundColor: backgroundColor,
      borderRadius: 20,
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'relative',
      shadowColor: backgroundColor,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 8,
    }, animatedStyle]}>

      <View style={{ flex: 1, marginRight: 20 }}>
        <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: 'bold', marginBottom: 6 }}>
          Nhiệm vụ hôm nay
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginBottom: 12 }}>
          {statusText}
        </Text>
        <TouchableOpacity
          onPress={onViewTasks}
          style={{
            backgroundColor: COLORS.white,
            paddingHorizontal: 18,
            paddingVertical: 10,
            borderRadius: 24,
            alignSelf: 'flex-start',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Ionicons name="calendar-outline" size={16} color={backgroundColor} />
          <Text style={{ color: backgroundColor, fontSize: 14, fontWeight: 'bold' }}>Xem lịch</Text>
        </TouchableOpacity>
      </View>

      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <View style={{
          width: 70,
          height: 70,
          borderRadius: 35,
          borderWidth: 3,
          borderColor: COLORS.white,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.15)',
        }}>
          <Text style={{ color: COLORS.white, fontSize: 22, fontWeight: 'bold' }}>
            {completedTasks}/{totalTasks}
          </Text>
        </View>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 4 }}>
          Hoàn thành
        </Text>
      </View>
    </Animated.View>
  );
}

