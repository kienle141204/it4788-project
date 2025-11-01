import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/themes';

interface TaskSummaryCardProps {
  totalTasks: number;
  onViewTasks: () => void;
}

export default function TaskSummaryCard({ totalTasks, onViewTasks }: TaskSummaryCardProps) {
  return (
    <View style={{
      marginHorizontal: 20,
      marginBottom: 20,
      backgroundColor: COLORS.purple,
      borderRadius: 16,
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'relative'
    }}>
      {/* Left content */}
      <View style={{ flex: 1, marginRight: 20 }}>
        <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: '600', marginBottom: 10 }}>
          Tổng số nhiệm vụ hôm nay
        </Text>
        <TouchableOpacity
          onPress={onViewTasks}
          style={{
            backgroundColor: COLORS.white,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            alignSelf: 'flex-start'
          }}
        >
          <Text style={{ color: COLORS.purple, fontSize: 14, fontWeight: '600' }}>View Task</Text>
        </TouchableOpacity>
      </View>

      {/* Progress circle */}
      <View style={{ alignItems: 'center' }}>
        <View style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          borderWidth: 3,
          borderColor: COLORS.white,
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative'
        }}>
          <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: 'bold' }}>{totalTasks}</Text>
        </View>
      </View>
    </View>
  );
}
