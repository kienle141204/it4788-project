import React, { useEffect, useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import { checkAsyncStorage } from '@/utils/checkAsyncStorage';
import { pushNotificationService } from '@/service/pushNotifications';
import { biometricService } from '@/service/biometric';
import { loginUSer } from '@/service/auth';
import { inAppLogger } from '@/utils/logger';

export default function Index() {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect( () => {
    
    const checkLogin = async () => {
      try {
        await pushNotificationService.setupAndroidNotificationChannel();
        
        const token = await checkAsyncStorage();
        

        if (token) {
          setIsLoggedIn(true);
          
          // Kiểm tra và yêu cầu permission notification (không hiển thị lỗi nếu từ chối)
          try {
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const hasPermission = await pushNotificationService.checkAndRequestNotificationPermission();
            
            if (hasPermission) {
              console.log('[Index] 🔔 Notification permission granted, registering token...');
              try {
                await pushNotificationService.registerTokenWithBackend();
              } catch (error: any) {
                console.warn('[Index] ⚠️ Push notification token registration failed:', error?.message);
                inAppLogger.log(`⚠️ Push notification registration failed: ${error?.message || 'Unknown error'}`, 'Index');
              }
            } else {
              console.log('[Index] ℹ️ Notification permission not granted, skipping token registration');
            }
          } catch (error: any) {
            console.error('[Index] ❌ Error checking notification permission:', error?.message || error);
          }
        } else {
          // Nếu chưa có token, kiểm tra xem có thể dùng đăng nhập bằng vân tay không
          const canUseBiometric = await biometricService.canUseBiometricLogin();
          
          if (canUseBiometric) {
            // Tự động hiển thị dialog xác thực sinh trắc học
            const authResult = await biometricService.authenticate('Xác thực để đăng nhập');
            
            if (authResult.success) {
              try {
                // Lấy thông tin đăng nhập đã lưu
                const savedEmail = await biometricService.getSavedEmail();
                const savedPassword = await biometricService.getSavedPassword();

                if (savedEmail && savedPassword) {
                  // Đăng nhập với thông tin đã lưu
                  const res = await loginUSer({ email: savedEmail, password: savedPassword });

                  if (res && !res.statusCode) {
                    // Đăng nhập thành công
                    const access = res?.access_token;
                    const refresh = res?.refresh_token;

                    if (access && refresh) {
                      await AsyncStorage.setItem('access_token', access);
                      await AsyncStorage.setItem('refresh_token', refresh);

                      // Đăng ký push notification token (không hiển thị lỗi nếu thất bại)
                      try {
                        await pushNotificationService.registerTokenWithBackend();
                      } catch (error: any) {
                        console.warn('[Index] Push notification registration failed:', error?.message);
                        inAppLogger.log(`⚠️ Push notification registration failed: ${error?.message || 'Unknown error'}`, 'Index');
                      }

                      setIsLoggedIn(true);
                    }
                  }
                }
              } catch (error: any) {
                console.error('[Index] Biometric login error:', error);
                // Không hiển thị alert, chỉ log lỗi
              }
            }
          }
        }
      } catch (e) {
        console.error('[Index] Error in checkLogin:', e);
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
