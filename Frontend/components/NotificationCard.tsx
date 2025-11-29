import React from 'react';
import { View, Text } from 'react-native';
import { COLORS } from '../constants/themes';

interface NotificationCardProps {
  title: string;
  message: string;
  progress: number;
}

export default function NotificationCard({ title, message, progress }: NotificationCardProps) {
  return (
    <View style={{
      backgroundColor: COLORS.lightBlue,
      borderRadius: 12,
      padding: 16,
      // marginTop: 10
    }}>
      <Text style={{ color: COLORS.darkGrey, fontSize: 14, marginBottom: 8, fontWeight: 'bold' }}>
        {message}
      </Text>
      <View style={{
        height: 4,
        backgroundColor: COLORS.lightGrey,
        borderRadius: 2,
        overflow: 'hidden'
      }}>
        <View style={{
          height: '100%',
          width: `${progress}%`,
          backgroundColor: COLORS.blue,
          borderRadius: 2
        }} />
      </View>
    </View>
  );
}
