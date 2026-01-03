import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { COLORS } from '../constants/themes';

interface Feature {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor?: string;
  onPress: () => void;
}

interface FeatureGridProps {
  features: Feature[];
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

function FeatureItem({ feature, index }: { feature: Feature; index: number }) {
  // Animation values - start with visible to avoid flicker
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  const animateIn = () => {
    opacity.value = 0;
    scale.value = 0.9;
    const delay = index * 60; // 60ms delay between each item
    opacity.value = withDelay(delay, withTiming(1, { duration: 350 }));
    scale.value = withDelay(delay, withTiming(1, { duration: 350 }));
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

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchableOpacity
      key={feature.id}
      onPress={feature.onPress}
      style={[
        {
          width: '48%',
          backgroundColor: COLORS.white,
          borderRadius: 20,
          padding: 18,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
          height: 110,
          alignItems: 'flex-start',
        },
        animatedStyle,
      ]}
    >
      <View style={{
        backgroundColor: feature.bgColor || '#F3F4F6',
        padding: 12,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
      }}>
        <Ionicons name={feature.icon} size={26} color={feature.color} />
      </View>

      <Text style={{
        fontSize: 16,
        color: '#1F2937',
        fontWeight: '600',
        marginTop: 8,
      }}>
        {feature.name}
      </Text>
    </AnimatedTouchableOpacity>
  );
}

export default function FeatureGrid({ features }: FeatureGridProps) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
      {features.map((feature, index) => (
        <FeatureItem key={feature.id} feature={feature} index={index} />
      ))}
    </View>
  );
}
