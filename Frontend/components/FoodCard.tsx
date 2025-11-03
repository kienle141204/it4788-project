import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { foodStyles } from '../styles/food.styles';

interface FoodCardProps {
  id: string;
  name: string;
  rating?: string;
  image_url?: string | null;
  onPress?: (id: string) => void;
}

export default function FoodCard({ id, name, rating = '', image_url, onPress }: FoodCardProps) {
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
      {/* Image Placeholder */}
      <View style={foodStyles.cardImageContainer}>
        {image_url ? (
          <View style={foodStyles.cardImagePlaceholder}>
            {/* You can replace this with Image component when implementing */}
            <Ionicons name="image" size={32} color="#FF69B4" />
          </View>
        ) : (
          <View style={foodStyles.cardImagePlaceholder}>
            <Ionicons name="fish" size={20} color="#FF69B4" style={{ position: 'absolute', top: 8, left: 8 }} />
            <Ionicons name="leaf" size={16} color="#FF69B4" style={{ position: 'absolute', bottom: 10, left: 12 }} />
            <Ionicons name="restaurant" size={18} color="#FF69B4" style={{ position: 'absolute', top: 10, right: 10 }} />
          </View>
        )}
      </View>

      {/* Text Content */}
      <View style={foodStyles.cardContent}>
        <Text style={foodStyles.cardTitle}>{name}</Text>
        <Text style={foodStyles.cardRating}>Đánh giá: {rating}</Text>
      </View>
    </TouchableOpacity>
  );
}

