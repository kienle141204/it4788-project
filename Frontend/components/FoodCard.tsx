import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { foodStyles } from '../styles/food.styles';

interface FoodCardProps {
  id: string;
  name: string;
  image_url?: string | null;
  onPress?: (id: string) => void;
}

export default function FoodCard({ id, name, image_url, onPress }: FoodCardProps) {
  const handlePress = () => {
    if (onPress) {
      onPress(id);
    }
  };

  return (
    <TouchableOpacity 
      style={foodStyles.card} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Image */}
      <View style={foodStyles.cardImageContainer}>
        {image_url ? (
          <Image 
            source={{ uri: image_url }}
            style={foodStyles.cardImage}
            resizeMode="cover"
          />
        ) : (
          <View style={foodStyles.cardImagePlaceholder}>
            <Ionicons name="restaurant" size={28} color="#FF69B4" />
          </View>
        )}
      </View>

      {/* Text Content */}
      <View style={foodStyles.cardContent}>
        <Text 
          style={foodStyles.cardTitle}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {name}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

