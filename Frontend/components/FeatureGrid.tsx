import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/themes';

interface Feature {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}

interface FeatureGridProps {
  features: Feature[];
}

export default function FeatureGrid({ features }: FeatureGridProps) {
  return (
    <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.darkGrey, marginRight: 8 }}>
          Chức năng
        </Text>
        <Text style={{ fontSize: 14, color: COLORS.purple, fontWeight: '600' }}>
          {features.length}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginLeft: 20, marginRight: 20 }}>
        {features.map((feature, index) => (
          <TouchableOpacity
            key={feature.id}
            onPress={feature.onPress}
            style={{
              width: '27%',
              aspectRatio: 1,
              backgroundColor: COLORS.white,
              borderRadius: 10,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 12,
              boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
              elevation: 3
            }}
          >
            <Ionicons name={feature.icon} size={32} color={feature.color} />
            <Text style={{
              fontSize: 11,
              color: COLORS.darkGrey,
              marginTop: 6,
              textAlign: 'center',
              fontWeight: '500'
            }}>
              {feature.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
