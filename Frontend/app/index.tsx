import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import { checkAsyncStorage } from '@/utils/checkAsyncStorage';
import { pushNotificationService } from '@/service/pushNotifications';

export default function Index() {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect( () => {
    
    const checkLogin = async () => {
      try {
        const token = await checkAsyncStorage();
        setIsLoggedIn(token);
        
        // Nếu đã đăng nhập, đăng ký push notification token
        if (token) {
          try {
            await pushNotificationService.registerTokenWithBackend();
          } catch (error) {
            // Không block app flow nếu đăng ký token fail
          }
        }
      } catch (e) {
      } finally {
        setIsReady(true);
      }
    };
    checkLogin();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Redirect  href={isLoggedIn ? '/(tabs)/home' : '/(auth)'} />;
}
