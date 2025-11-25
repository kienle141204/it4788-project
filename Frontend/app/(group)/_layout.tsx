import { Stack } from 'expo-router';
import React from 'react';

export default function GroupLayout() {
  return (
    <Stack screenOptions={{headerShown:false}} >
      <Stack.Screen
        name="index"
        // options={{
        //   headerShown: false,
        //   title: 'Gia đình',
        // }}
      />
    </Stack>
  );
}

