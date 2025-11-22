import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { styles } from '@/styles/auth.styles';

interface ButtonProps {
  loading?: boolean;
  text: string;
  onPress?: () => void;
}

export default function Button({ loading, text, onPress }: ButtonProps) {
  return (
    <View style={styles.loginButton}>
      <TouchableOpacity style={styles.touchAble} onPress={onPress}>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.loginButtonText}>{text}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
