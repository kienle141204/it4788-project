import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import { checkAsyncStorage } from '@/utils/checkAsyncStorage';

export default function Index() {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  console.log('app/index')

  useEffect( () => {
    
    const checkLogin = async () => {
      try {
        const token = await checkAsyncStorage();
        setIsLoggedIn(token);
      } catch (e) {
        console.error('Lỗi kiểm tra token:', e);
      } finally {
        setIsReady(true);
      }
    };
    checkLogin();
  }, []);

  // Đợi kiểm tra token xong mới redirect
  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Redirect  href={isLoggedIn ? '/(home)' : '/(auth)'} />;
}
