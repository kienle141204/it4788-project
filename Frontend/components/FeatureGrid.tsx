import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

export default function FeatureGrid({ features }: FeatureGridProps) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
      {features.map((feature, index) => (
        <TouchableOpacity
          key={feature.id}
          onPress={feature.onPress}
          style={{
            width: '48%',
            backgroundColor: COLORS.white,
            borderRadius: 20,
            padding: 16,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
            height: 100,
            // justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}
        >
          <View style={{
            backgroundColor: feature.bgColor || '#F3F4F6',
            padding: 10,
            borderRadius: 30,
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Ionicons name={feature.icon} size={24} color={feature.color} />
          </View>

          <Text style={{
            fontSize: 16,
            color: '#1F2937',
            fontWeight: 'bold',
            marginTop: 8
          }}>
            {feature.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
