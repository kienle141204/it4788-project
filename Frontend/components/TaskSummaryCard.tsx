import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

  return (
    <View style={{
      marginHorizontal: 20,
      marginBottom: 20,
      backgroundColor: backgroundColor,
      borderRadius: 16,
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'relative',
      shadowColor: backgroundColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    }}>

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
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            alignSelf: 'flex-start',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
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
    </View>
  );
}

