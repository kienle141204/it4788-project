import { Stack } from 'expo-router';
import React from 'react';

export default function MealLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          title: 'Bữa ăn',
        }}
      />
      <Stack.Screen
        name="create-menu"
        options={{
          headerShown: false,
          title: 'Thêm thực đơn',
        }}
      />
      <Stack.Screen
        name="edit-menu"
        options={{
          headerShown: false,
          title: 'Sửa thực đơn',
        }}
      />
    </Stack>
  );
}


