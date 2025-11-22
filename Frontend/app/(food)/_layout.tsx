import { Stack } from 'expo-router';
import React from 'react';

export default function FoodLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
          title: 'Món ăn'
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          headerShown: false,
          title: 'Chi tiết món ăn'
        }} 
      />
    </Stack>
  );
}

