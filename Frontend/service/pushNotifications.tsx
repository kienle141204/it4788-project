// @ts-ignore - expo-notifications types sẽ được cài khi npm install
import * as Notifications from 'expo-notifications';
// @ts-ignore - expo-device types sẽ được cài khi npm install
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { postAccess, deleteAccess } from '@/utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  private expoPushToken: string | null = null;
  private isRegistered: boolean = false;

  /**
   * Request permission và lấy Expo Push Token
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      // Kiểm tra xem có phải device thật không (không phải simulator)
      if (!Device.isDevice) {
        console.warn('[PushNotifications] Must use physical device for Push Notifications');
        return null;
      }

      // Request permission (iOS)
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
      } else {
        // Android: permission được tự động grant
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          console.warn('[PushNotifications] Failed to get push token for Android!');
          return null;
        }
      }

      // Lấy Expo Push Token
      // Note: Expo Push Token sẽ được convert sang FCM token bởi Expo Push Notification service
      // Backend sẽ nhận Expo Push Token và Expo sẽ tự động route đến FCM
      const tokenData = await Notifications.getExpoPushTokenAsync();
      
      this.expoPushToken = tokenData.data;
      console.log('[PushNotifications] Expo Push Token:', this.expoPushToken);
      
      return this.expoPushToken;
    } catch (error) {
      console.error('[PushNotifications] Error registering for push notifications:', error);
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
        return false;
      }

      // Lấy Expo Push Token nếu chưa có
      if (!this.expoPushToken) {
        this.expoPushToken = await this.registerForPushNotifications();
        if (!this.expoPushToken) {
          console.warn('[PushNotifications] No push token available');
          return false;
        }
      }

      // Gửi token lên backend
      const response = await postAccess('notifications/device-token', {
        deviceToken: this.expoPushToken,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
      });

      if (response?.success) {
        this.isRegistered = true;
        console.log('[PushNotifications] Token registered successfully with backend');
        return true;
      } else {
        console.error('[PushNotifications] Failed to register token:', response);
        return false;
      }
    } catch (error) {
      console.error('[PushNotifications] Error registering token with backend:', error);
      return false;
    }
  }

  /**
   * Xóa token khỏi backend (khi logout)
   */
  async unregisterToken(): Promise<void> {
    try {
      if (!this.expoPushToken) {
        return;
      }

      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        console.log('[PushNotifications] User not logged in, skipping token unregistration');
        return;
      }

      await deleteAccess(`notifications/device-token/${this.expoPushToken}`);
      this.isRegistered = false;
      console.log('[PushNotifications] Token unregistered successfully');
    } catch (error) {
      console.error('[PushNotifications] Error unregistering token:', error);
    }
  }

  /**
   * Setup notification listeners
   */
  setupNotificationListeners(
    onNotificationReceived?: (notification: any) => void,
    onNotificationTapped?: (response: any) => void,
  ) {
    // Listener cho notification khi app đang foreground
    const receivedListener = Notifications.addNotificationReceivedListener((notification: any) => {
      console.log('[PushNotifications] Notification received (foreground):', notification);
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });

    // Listener cho khi user tap vào notification
    const responseListener = Notifications.addNotificationResponseReceivedListener((response: any) => {
      console.log('[PushNotifications] Notification tapped:', response);
      if (onNotificationTapped) {
        onNotificationTapped(response);
      }
    });

    // Return cleanup function
    return () => {
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
   * Lấy Expo Push Token hiện tại
   */
  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Kiểm tra xem token đã được đăng ký chưa
   */
  isTokenRegistered(): boolean {
    return this.isRegistered;
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();

