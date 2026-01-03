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
        // Tạo Android notification channel trước (nếu là Android)
        await pushNotificationService.setupAndroidNotificationChannel();
        
        const token = await checkAsyncStorage();
        setIsLoggedIn(token);
        
        // Nếu đã đăng nhập, kiểm tra và yêu cầu permission notification
        if (token) {
          try {
            // Đợi một chút để đảm bảo app đã sẵn sàng
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Kiểm tra permission notification
            const hasPermission = await pushNotificationService.checkAndRequestNotificationPermission();
            
            if (hasPermission) {
              console.log('[Index] 🔔 Notification permission granted, registering token...');
              // Đăng ký token với backend (có retry logic bên trong)
              const registered = await pushNotificationService.registerTokenWithBackend();
              if (registered) {
                console.log('[Index] ✅ Push notification token registered successfully');
              } else {
                console.warn('[Index] ⚠️ Push notification token registration failed (check logs above)');
                console.warn('[Index] ⚠️ This might be normal if:');
                console.warn('[Index]   - Running on emulator/simulator');
                console.warn('[Index]   - Firebase not configured properly');
                console.warn('[Index]   - Network issues');
              }
            } else {
              console.log('[Index] ℹ️ Notification permission not granted, skipping token registration');
            }
          } catch (error: any) {
            console.error('[Index] ❌ Error checking notification permission:', error?.message || error);
            // Không block app flow nếu có lỗi
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
