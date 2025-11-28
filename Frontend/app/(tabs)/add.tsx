import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/themes';

// This is a placeholder screen for the add tab
// The actual add action is handled by the tab press listener in _layout.tsx
export default function AddScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Add Screen Placeholder</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  text: {
    fontSize: 18,
    color: COLORS.darkGrey,
  },
});

