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
      // marginTop: 10,
      marginBottom: 20,
      backgroundColor: COLORS.purple,
      borderRadius: 16,
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'relative'
    }}>

      <TouchableOpacity
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 1,
          // marginBottom: 30,
        }}
      >
        <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.white} />
      </TouchableOpacity>


      <View style={{ flex: 1, marginRight: 20 }}>
        <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
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
          <Text style={{ color: COLORS.purple, fontSize: 14, fontWeight: 'bold' }}>View Task</Text>
        </TouchableOpacity>
      </View>


      <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
        <View style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          borderWidth: 3,
          borderColor: COLORS.white,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: 'bold' }}>{totalTasks}</Text>
        </View>
      </View>
    </View>
  );
}
