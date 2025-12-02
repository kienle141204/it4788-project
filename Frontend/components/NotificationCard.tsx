import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/themes';

interface NotificationCardProps {
  title: string;
  message: string;
  progress?: number;
  type?: 'info' | 'warning';
}

export default function NotificationCard({ title, message, progress = 0, type = 'info' }: NotificationCardProps) {
  const isWarning = type === 'warning';

  if (isWarning) {
    return (
      <View style={[styles.container, { backgroundColor: COLORS.warningBackground, flexDirection: 'row', alignItems: 'center' }]}>
        <View style={styles.iconContainer}>
          <Ionicons name="warning" size={32} color="#D97706" />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: COLORS.warningText }]}>{title}</Text>
          <Text style={[styles.message, { color: COLORS.warningText }]}>{message}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: COLORS.lightBlue }]}>
      <Text style={[styles.message, { color: COLORS.darkGrey, marginBottom: 8 }]}>
        {message}
      </Text>
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
  },
  iconContainer: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: COLORS.lightGrey,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.blue,
    borderRadius: 2,
  },
});
