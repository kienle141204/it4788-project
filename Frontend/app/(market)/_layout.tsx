import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MarketScreen from './market_screen';
import { Stack } from 'expo-router';
// import ProductScreen from './ProductScree

export default function App() {
  return (
    <Stack screenOptions={{headerShown:false}}>
        <Stack.Screen name='market_screen'/>
        {/* <Stack.Screen
          name="Product"
          component={ProductScreen}
          options={{ title: 'Chi tiết sản phẩm' }}
        /> */}
    </Stack>
  );
}
