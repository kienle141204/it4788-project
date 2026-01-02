// @ts-ignore - expo-notifications types sẽ được cài khi npm install
import * as Notifications from 'expo-notifications';
// @ts-ignore - expo-device types sẽ được cài khi npm install
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { postAccess, deleteAccess } from '@/utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { inAppLogger } from '@/utils/logger';
// Firebase Messaging - sử dụng FCM tokens trực tiếp
import messaging from '@react-native-firebase/messaging';

// Firebase Configuration
// Backend sử dụng Firebase project: push-notification-it4788
// Sử dụng FCM tokens trực tiếp từ Firebase Messaging

// Cấu hình cách hiển thị notification khi app đang foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationData {
  notificationId?: string;
  type?: string;
  [key: string]: any;
}

class PushNotificationService {
  private fcmToken: string | null = null;
  private isRegistered: boolean = false;

  /**
   * Request permission và lấy FCM Token trực tiếp từ Firebase
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      // Kiểm tra xem có phải device thật không (không phải simulator)
      if (!Device.isDevice) {
        console.warn('[PushNotifications] Must use physical device for Push Notifications');
        return null;
      }

      // Request permission cho notifications
      let permissionStatus = 'granted';
      
      if (Platform.OS === 'ios') {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          console.warn('[PushNotifications] Failed to get push token for iOS!');
          return null;
        }
        permissionStatus = finalStatus;
      } else {
        // Android: Request permission từ Firebase Messaging
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          console.warn('[PushNotifications] Failed to get push token for Android! Permission:', authStatus);
          inAppLogger.log(`❌ Android permission denied: ${authStatus}`, 'PushNotifications');
          return null;
        }
        
        inAppLogger.log('✅ Android notification permission granted', 'PushNotifications');
      }

      // Lấy FCM Token trực tiếp từ Firebase Messaging
      // Backend sử dụng Firebase project: push-notification-it4788
      console.log('[PushNotifications] 🔄 Requesting FCM Token from Firebase...');
      console.log('[PushNotifications] 📋 Firebase project: push-notification-it4788');
      
      const token = await messaging().getToken();
      
      if (!token) {
        console.warn('[PushNotifications] No FCM token received');
        inAppLogger.log('❌ No FCM token received', 'PushNotifications');
        return null;
      }
      
      this.fcmToken = token;
      console.log('[PushNotifications] ✅ FCM Token obtained:', this.fcmToken);
      console.log('[PushNotifications] 📱 Platform:', Platform.OS);
      console.log('[PushNotifications] 📱 Token length:', this.fcmToken?.length);
      inAppLogger.log(`✅ FCM Token obtained: ${this.fcmToken?.substring(0, 30)}...`, 'PushNotifications');
      inAppLogger.log(`📱 Platform: ${Platform.OS}`, 'PushNotifications');
      
      // Lắng nghe khi token được refresh
      messaging().onTokenRefresh((newToken) => {
        console.log('[PushNotifications] 🔄 FCM Token refreshed:', newToken);
        this.fcmToken = newToken;
        // Tự động đăng ký lại token mới với backend
        this.registerTokenWithBackend();
      });
      
      return this.fcmToken;
    } catch (error: any) {
      console.error('[PushNotifications] Error registering for push notifications:', error);
      console.error('[PushNotifications] Error details:', error?.message || error);
      inAppLogger.log(`❌ Error getting FCM token: ${error?.message || 'Unknown error'}`, 'PushNotifications');
      return null;
    }
  }

  /**
   * Đăng ký token với backend
   */
  async registerTokenWithBackend(): Promise<boolean> {
    try {
      // Kiểm tra xem user đã đăng nhập chưa
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        console.log('[PushNotifications] User not logged in, skipping token registration');
        inAppLogger.log('⚠️ User not logged in, skipping token registration', 'PushNotifications');
        return false;
      }
      inAppLogger.log('✅ User is logged in', 'PushNotifications');

      // Lấy FCM Token nếu chưa có
      if (!this.fcmToken) {
        inAppLogger.log('🔄 Requesting FCM token...', 'PushNotifications');
        this.fcmToken = await this.registerForPushNotifications();
        if (!this.fcmToken) {
          console.warn('[PushNotifications] No FCM token available');
          inAppLogger.log('❌ No FCM token available', 'PushNotifications');
          return false;
        }
      } else {
        inAppLogger.log('✅ Using existing FCM token', 'PushNotifications');
      }

      // Gửi FCM token lên backend
      console.log('[PushNotifications] 📤 Sending FCM token to backend...');
      console.log('[PushNotifications] 📱 Token:', this.fcmToken?.substring(0, 30) + '...');
      console.log('[PushNotifications] 📱 Platform:', Platform.OS);
      inAppLogger.log('📤 Sending FCM token to backend...', 'PushNotifications');
      inAppLogger.log(`📱 Token: ${this.fcmToken?.substring(0, 30)}...`, 'PushNotifications');
      inAppLogger.log(`📱 Platform: ${Platform.OS}`, 'PushNotifications');
      
      const response = await postAccess('notifications/device-token', {
        deviceToken: this.fcmToken,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
      });

      console.log('[PushNotifications] 📥 Backend response:', JSON.stringify(response, null, 2));
      inAppLogger.log(`📥 Backend response: ${JSON.stringify(response)}`, 'PushNotifications');

      if (response?.success) {
        this.isRegistered = true;
        console.log('[PushNotifications] ✅ Token registered successfully with backend');
        console.log('[PushNotifications] 📝 Registration response:', response);
        inAppLogger.log('✅ Token registered successfully with backend', 'PushNotifications');
        return true;
      } else {
        console.error('[PushNotifications] ❌ Failed to register token. Response:', response);
        console.error('[PushNotifications] ❌ Response status:', response?.statusCode || 'unknown');
        console.error('[PushNotifications] ❌ Response message:', response?.message || 'unknown');
        const errorMsg = response?.message || response?.error || JSON.stringify(response) || 'Unknown error';
        inAppLogger.log(`❌ Failed: ${errorMsg}`, 'PushNotifications');
        inAppLogger.log(`❌ Status: ${response?.statusCode || 'unknown'}`, 'PushNotifications');
        return false;
      }
    } catch (error: any) {
      console.error('[PushNotifications] ❌ Error registering token with backend:', error);
      console.error('[PushNotifications] ❌ Error type:', error?.constructor?.name);
      console.error('[PushNotifications] ❌ Error message:', error?.message);
      console.error('[PushNotifications] ❌ Error stack:', error?.stack);
      
      // Log chi tiết hơn
      let errorDetails = `❌ Error: ${error?.message || 'Unknown error'}`;
      
      if (error?.response) {
        // Axios error với response
        const status = error.response.status;
        const statusText = error.response.statusText;
        const data = error.response.data;
        
        console.error('[PushNotifications] ❌ Error response status:', status);
        console.error('[PushNotifications] ❌ Error response statusText:', statusText);
        console.error('[PushNotifications] ❌ Error response data:', data);
        
        errorDetails = `❌ HTTP ${status} ${statusText}`;
        if (data?.message) {
          errorDetails += `: ${data.message}`;
        } else if (typeof data === 'string') {
          errorDetails += `: ${data}`;
        } else if (data) {
          errorDetails += `: ${JSON.stringify(data)}`;
        }
        
        inAppLogger.log(errorDetails, 'PushNotifications');
        inAppLogger.log(`❌ Status: ${status}`, 'PushNotifications');
      } else if (error?.request) {
        // Network error (không có response)
        console.error('[PushNotifications] ❌ Network error - no response received');
        errorDetails = '❌ Network error: No response from server';
        inAppLogger.log(errorDetails, 'PushNotifications');
        inAppLogger.log('❌ Check internet connection', 'PushNotifications');
      } else {
        // Other error
        inAppLogger.log(errorDetails, 'PushNotifications');
      }
      
      return false;
    }
  }

  /**
   * Xóa token khỏi backend (khi logout)
   */
  async unregisterToken(): Promise<void> {
    try {
      if (!this.fcmToken) {
        return;
      }

      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        console.log('[PushNotifications] User not logged in, skipping token unregistration');
        return;
      }

      await deleteAccess(`notifications/device-token/${this.fcmToken}`);
      this.isRegistered = false;
      // Xóa FCM token local
      this.fcmToken = null;
      console.log('[PushNotifications] FCM token unregistered successfully');
    } catch (error) {
      console.error('[PushNotifications] Error unregistering token:', error);
    }
  }

  /**
   * Setup notification listeners cho FCM
   */
  setupNotificationListeners(
    onNotificationReceived?: (notification: any) => void,
    onNotificationTapped?: (response: any) => void,
  ) {
    // Listener cho notification khi app đang foreground (FCM)
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      console.log('[PushNotifications] 📬 FCM Notification received (foreground):', {
        title: remoteMessage.notification?.title,
        body: remoteMessage.notification?.body,
        data: remoteMessage.data,
      });
      
      // Hiển thị notification qua expo-notifications để có UI đẹp
      if (remoteMessage.notification) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: remoteMessage.notification.title || '',
            body: remoteMessage.notification.body || '',
            data: remoteMessage.data || {},
          },
          trigger: null, // Hiển thị ngay lập tức
        });
      }
      
      if (onNotificationReceived) {
        onNotificationReceived(remoteMessage);
      }
    });

    // Listener cho khi app được mở từ notification (khi app đang background/quit)
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('[PushNotifications] 👆 FCM Notification opened app:', {
        title: remoteMessage.notification?.title,
        body: remoteMessage.notification?.body,
        data: remoteMessage.data,
      });
      if (onNotificationTapped) {
        onNotificationTapped(remoteMessage);
      }
    });

    // Kiểm tra notification khi app được mở từ trạng thái quit
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('[PushNotifications] 👆 FCM Notification opened app (from quit state):', {
            title: remoteMessage.notification?.title,
            body: remoteMessage.notification?.body,
            data: remoteMessage.data,
          });
          if (onNotificationTapped) {
            onNotificationTapped(remoteMessage);
          }
        }
      });

    // Listener cho expo-notifications (backup)
    const receivedListener = Notifications.addNotificationReceivedListener((notification: any) => {
      console.log('[PushNotifications] 📬 Expo Notification received:', {
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data,
      });
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener((response: any) => {
      console.log('[PushNotifications] 👆 Expo Notification tapped:', {
        title: response.notification.request.content.title,
        body: response.notification.request.content.body,
        data: response.notification.request.content.data,
      });
      if (onNotificationTapped) {
        onNotificationTapped(response);
      }
    });

    // Return cleanup function
    return () => {
      unsubscribeForeground();
      Notifications.removeNotificationSubscription(receivedListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }

  /**
   * Kiểm tra notification khi app được mở từ notification (app đang closed)
   * Note: getLastNotificationResponseAsync chỉ khả dụng trên iOS
   */
  async checkInitialNotification(): Promise<any | null> {
    try {
      // Chỉ check trên iOS vì Android không hỗ trợ method này
      if (Platform.OS === 'ios') {
        const notification = await Notifications.getLastNotificationResponseAsync();
        return notification?.notification || null;
      }
      // Android sẽ handle notification qua response listener
      return null;
    } catch (error: any) {
      // Ignore error nếu method không khả dụng trên platform này
      if (error?.message?.includes('not available')) {
        console.log('[PushNotifications] Method not available on this platform');
      } else {
        console.error('[PushNotifications] Error checking initial notification:', error);
      }
      return null;
    }
  }

  /**
   * Lấy FCM Token hiện tại
   */
  getFCMToken(): string | null {
    return this.fcmToken;
  }

  /**
   * @deprecated Sử dụng getFCMToken() thay vì method này
   */
  getExpoPushToken(): string | null {
    return this.fcmToken;
  }

  /**
   * Kiểm tra xem token đã được đăng ký chưa
   */
  isTokenRegistered(): boolean {
    return this.isRegistered;
  }

  /**
   * Force re-register token (useful for debugging)
   */
  async forceReregister(): Promise<boolean> {
    console.log('[PushNotifications] 🔄 Force re-registering FCM token...');
    this.fcmToken = null;
    this.isRegistered = false;
    return await this.registerTokenWithBackend();
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();

