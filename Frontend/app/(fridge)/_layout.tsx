import { Stack } from 'expo-router';
import React from 'react';

export default function FridgeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
          title: 'Tủ lạnh'
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          headerShown: false,
          title: 'Chi tiết tủ lạnh'
        }} 
      />
      <Stack.Screen 
        name="create" 
        options={{ 
          headerShown: false,
          title: 'Tạo tủ lạnh mới'
        }} 
      />
    </Stack>
  );
}

