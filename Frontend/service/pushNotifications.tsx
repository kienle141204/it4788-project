// @ts-ignore - expo-notifications types sẽ được cài khi npm install
import * as Notifications from 'expo-notifications';
// @ts-ignore - expo-device types sẽ được cài khi npm install
import * as Device from 'expo-device';
import { Platform, Alert, Linking } from 'react-native';
import { postAccess, deleteAccess } from '@/utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { inAppLogger } from '@/utils/logger';
// @ts-ignore - notifee types - lazy load để tránh lỗi khi native module chưa sẵn sàng
let notifee: any = null;
let AndroidImportance: any = null;
let EventType: any = null;
let AndroidStyle: any = null;

try {
  if (Device.isDevice && Platform.OS !== 'web') {
    const notifeeModule = require('@notifee/react-native');
    notifee = notifeeModule.default;
    AndroidImportance = notifeeModule.AndroidImportance;
    EventType = notifeeModule.EventType;
    AndroidStyle = notifeeModule.AndroidStyle;
  }
} catch (error) {
  console.warn('[PushNotifications] Notifee not available (native module not found, need rebuild):', error);
}

// Firebase Messaging - sử dụng FCM tokens trực tiếp
// Bỏ qua khi chạy trên emulator/simulator hoặc web
let messaging: any = null;
try {
  // React Native Firebase chỉ hoạt động trên native platforms (iOS/Android)
  // Trên web, bỏ qua Firebase Messaging
  if (Device.isDevice && Platform.OS !== 'web') {
    messaging = require('@react-native-firebase/messaging').default;
    
    // Setup background message handler cho data-only messages
    // Handler này chạy khi app ở background/quit
    messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
      console.log('[PushNotifications] 📬 Background message received:', remoteMessage);
      
      // Lấy data từ message
      const title = remoteMessage.data?.title || 'Thông báo mới';
      const body = remoteMessage.data?.body || '';
      const imageUrl = remoteMessage.data?.image;
      
      // Hiển thị notification bằng Notifee (nếu có) hoặc expo-notifications
      if (notifee && Platform.OS === 'android') {
        try {
          await notifee.displayNotification({
            title,
            body,
            data: remoteMessage.data || {},
            android: {
              channelId: 'chat_messages',
              importance: AndroidImportance.HIGH,
              style: {
                type: AndroidStyle.BIGTEXT,
                text: body,
              },
              ...(imageUrl && {
                largeIcon: imageUrl,
              }),
              pressAction: {
                id: 'default',
              },
            },
          });
          console.log('[PushNotifications] ✅ Background notification displayed with Notifee');
        } catch (error) {
          console.error('[PushNotifications] ❌ Error displaying background notification:', error);
        }
      }
    });
  }
} catch (error) {
  console.warn('[PushNotifications] Firebase Messaging not available (likely running on emulator or web):', error);
}

// Firebase Configuration
// Backend sử dụng Firebase project: push-notification-it4788
// Sử dụng FCM tokens trực tiếp từ Firebase Messaging

// Cấu hình cách hiển thị notification khi app đang foreground
// Chỉ setup khi có device thật và không phải web
if (Device.isDevice && Platform.OS !== 'web') {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (error) {
    console.warn('[PushNotifications] Failed to set notification handler:', error);
  }
}

export interface PushNotificationData {
  notificationId?: string;
  type?: string;
  [key: string]: any;
}

class PushNotificationService {
  private fcmToken: string | null = null;
  private isRegistered: boolean = false;

  /**
   * Tạo Android notification channel với Notifee để control UI tốt hơn
   */
  async setupAndroidNotificationChannel() {
    if (Platform.OS !== 'android') {
      return;
    }

    if (!notifee) {
      console.warn('[PushNotifications] ⚠️ Notifee not available, using expo-notifications channel');
      // Fallback to expo-notifications
      try {
        await Notifications.setNotificationChannelAsync('chat_messages', {
          name: 'Chat Messages',
          description: 'Notifications for chat messages',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });
        console.log('[PushNotifications] ✅ Android notification channel created with expo-notifications (fallback)');
      } catch (error) {
        console.warn('[PushNotifications] ⚠️ Failed to create Android notification channel:', error);
      }
      return;
    }

    try {
      // Tạo channel với Notifee
      await notifee.createChannel({
        id: 'chat_messages',
        name: 'Chat Messages',
        description: 'Notifications for chat messages',
        importance: AndroidImportance.HIGH,
        vibration: true,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
        lights: true,
        lightColor: '#FF231F7C',
      });
      console.log('[PushNotifications] ✅ Android notification channel created with Notifee');
    } catch (error) {
      console.warn('[PushNotifications] ⚠️ Failed to create Android notification channel:', error);
    }
  }

  /**
   * Kiểm tra permission notification và hỏi người dùng nếu chưa bật
   */
  async checkAndRequestNotificationPermission(): Promise<boolean> {
    try {
      // Bỏ qua trên web
      if (Platform.OS === 'web') {
        return false;
      }

      // Bỏ qua trên emulator/simulator
      if (!Device.isDevice) {
        return false;
      }

      let hasPermission = false;

      if (Platform.OS === 'ios') {
        const { status } = await Notifications.getPermissionsAsync();
        hasPermission = status === 'granted';

        if (!hasPermission) {
          // Hỏi người dùng có muốn bật notification không
          return new Promise((resolve) => {
            Alert.alert(
              'Cho phép thông báo',
              'Ứng dụng cần quyền thông báo để gửi cho bạn các tin nhắn mới từ nhóm. Bạn có muốn bật thông báo không?',
              [
                {
                  text: 'Không',
                  style: 'cancel',
                  onPress: () => resolve(false),
                },
                {
                  text: 'Cài đặt',
                  onPress: async () => {
                    // Mở settings để bật notification
                    await Linking.openSettings();
                    resolve(false);
                  },
                },
                {
                  text: 'Cho phép',
                  onPress: async () => {
                    // Request permission trực tiếp
                    const { status: newStatus } = await Notifications.requestPermissionsAsync();
                    resolve(newStatus === 'granted');
                  },
                },
              ],
              { cancelable: false }
            );
          });
        }
      } else {
        // Android: Kiểm tra permission từ Firebase Messaging
        if (!messaging) {
          return false;
        }

        const authStatus = await messaging().hasPermission();
        hasPermission =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!hasPermission) {
          // Hỏi người dùng có muốn bật notification không
          return new Promise((resolve) => {
            Alert.alert(
              'Cho phép thông báo',
              'Ứng dụng cần quyền thông báo để gửi cho bạn các tin nhắn mới từ nhóm. Bạn có muốn bật thông báo không?',
              [
                {
                  text: 'Không',
                  style: 'cancel',
                  onPress: () => resolve(false),
                },
                {
                  text: 'Cài đặt',
                  onPress: async () => {
                    // Mở settings để bật notification
                    await Linking.openSettings();
                    resolve(false);
                  },
                },
                {
                  text: 'Cho phép',
                  onPress: async () => {
                    // Request permission trực tiếp
                    const newStatus = await messaging().requestPermission();
                    const enabled =
                      newStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                      newStatus === messaging.AuthorizationStatus.PROVISIONAL;
                    resolve(enabled);
                  },
                },
              ],
              { cancelable: false }
            );
          });
        }
      }

      return hasPermission;
    } catch (error) {
      console.error('[PushNotifications] Error checking notification permission:', error);
      return false;
    }
  }

  /**
   * Request permission và lấy FCM Token trực tiếp từ Firebase
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      // Bỏ qua trên web - push notifications không được hỗ trợ đầy đủ trên web
      if (Platform.OS === 'web') {
        console.warn('[PushNotifications] Push notifications are not fully supported on web platform');
        inAppLogger.log('⚠️ Web platform - Push notifications disabled', 'PushNotifications');
        return null;
      }

      // Kiểm tra xem có phải device thật không (không phải simulator)
      if (!Device.isDevice) {
        console.warn('[PushNotifications] Must use physical device for Push Notifications');
        inAppLogger.log('⚠️ Running on emulator/simulator - Push notifications disabled', 'PushNotifications');
        return null;
      }

      // Kiểm tra xem Firebase Messaging có sẵn không
      if (!messaging) {
        console.warn('[PushNotifications] Firebase Messaging not available');
        inAppLogger.log('⚠️ Firebase Messaging not available - Push notifications disabled', 'PushNotifications');
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
        if (!messaging) {
          console.warn('[PushNotifications] Firebase Messaging not available for Android');
          return null;
        }
        
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
      
      if (!messaging) {
        console.warn('[PushNotifications] Firebase Messaging not available');
        return null;
      }
      
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
      if (messaging) {
        messaging().onTokenRefresh((newToken: string) => {
          console.log('[PushNotifications] 🔄 FCM Token refreshed:', newToken);
          this.fcmToken = newToken;
          // Tự động đăng ký lại token mới với backend
          this.registerTokenWithBackend();
        });
      }
      
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
      // Bỏ qua trên web - push notifications không được hỗ trợ đầy đủ trên web
      if (Platform.OS === 'web') {
        console.log('[PushNotifications] Web platform - skipping token registration');
        inAppLogger.log('⚠️ Web platform - Push notifications disabled', 'PushNotifications');
        return false;
      }

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
      // Bỏ qua trên web
      if (Platform.OS === 'web') {
        return;
      }

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
   * Hiển thị notification bằng Notifee với format đúng
   */
  private async displayNotificationWithNotifee(
    title: string,
    body: string,
    data: any,
    imageUrl?: string,
  ) {
    if (Platform.OS === 'android') {
      // Kiểm tra Notifee có sẵn không
      if (!notifee) {
        console.warn('[PushNotifications] Notifee not available, using expo-notifications fallback');
        // Fallback to expo-notifications
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: data || {},
          },
          trigger: null,
        });
        return;
      }

      try {
        await notifee.displayNotification({
          title,
          body,
          data: data || {},
          android: {
            channelId: 'chat_messages',
            importance: AndroidImportance.HIGH,
            // BigText style để hiển thị đúng xuống dòng
            style: {
              type: AndroidStyle.BIGTEXT,
              text: body, // Body sẽ hiển thị với xuống dòng
            },
            // Thêm large icon (avatar) nếu có
            ...(imageUrl && {
              largeIcon: imageUrl,
            }),
            pressAction: {
              id: 'default',
            },
          },
        });
      } catch (error) {
        console.error('[PushNotifications] Error displaying notification with Notifee:', error);
        throw error;
      }
    } else {
      // iOS: vẫn dùng expo-notifications
      const iosContent: any = {
        title,
        body,
        data: data || {},
      };
      
      if (imageUrl) {
        iosContent.attachments = [
          {
            identifier: 'image',
            url: imageUrl,
            type: 'image',
          },
        ];
      }
      
      await Notifications.scheduleNotificationAsync({
        content: iosContent,
        trigger: null,
      });
    }
  }

  /**
   * Setup notification listeners cho FCM và Notifee
   */
  setupNotificationListeners(
    onNotificationReceived?: (notification: any) => void,
    onNotificationTapped?: (response: any) => void,
  ) {
    // Bỏ qua nếu không phải device thật, không có Firebase Messaging, hoặc đang chạy trên web
    if (!Device.isDevice || !messaging || Platform.OS === 'web') {
      console.warn('[PushNotifications] Skipping notification listeners setup (emulator/simulator/web or Firebase not available)');
      return () => {}; // Return empty cleanup function
    }

    // Setup Notifee foreground event handler cho Android
    if (Platform.OS === 'android' && notifee) {
      try {
        notifee.onForegroundEvent(({ type, detail }: any) => {
          console.log('[PushNotifications] Notifee foreground event:', type, detail);
          if (type === EventType.PRESS && onNotificationTapped) {
            onNotificationTapped({
              notification: {
                request: {
                  content: {
                    title: detail.notification?.title,
                    body: detail.notification?.body,
                    data: detail.notification?.data,
                  },
                },
              },
              data: detail.notification?.data,
            });
          }
        });

        // Setup Notifee background event handler cho Android
        notifee.onBackgroundEvent(async ({ type, detail }: any) => {
          console.log('[PushNotifications] Notifee background event:', type, detail);
          if (type === EventType.PRESS && onNotificationTapped) {
            // Gọi callback nếu có (có thể cần delay một chút để app đã sẵn sàng)
            setTimeout(() => {
              if (onNotificationTapped) {
                onNotificationTapped({
                  notification: {
                    request: {
                      content: {
                        title: detail.notification?.title,
                        body: detail.notification?.body,
                        data: detail.notification?.data,
                      },
                    },
                  },
                  data: detail.notification?.data,
                });
              }
            }, 100);
          }
        });
      } catch (error) {
        console.warn('[PushNotifications] Failed to setup Notifee event handlers:', error);
      }
    }

    // Listener cho notification khi app đang foreground (FCM)
    // Với data-only message, data nằm trong remoteMessage.data
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage: any) => {
      console.log('[PushNotifications] 📬 FCM Message received (foreground):', remoteMessage);
      
      // Lấy data từ message (data-only message)
      const title = remoteMessage.data?.title || remoteMessage.notification?.title || 'Thông báo mới';
      const body = remoteMessage.data?.body || remoteMessage.notification?.body || '';
      const imageUrl = remoteMessage.data?.image || remoteMessage.notification?.android?.imageUrl;

      try {
        await this.displayNotificationWithNotifee(title, body, remoteMessage.data, imageUrl);
      } catch (error) {
        console.error('[PushNotifications] Error displaying notification with Notifee:', error);
        // Fallback to expo-notifications nếu Notifee fail
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: remoteMessage.data || {},
          },
          trigger: null,
        });
      }
      
      if (onNotificationReceived) {
        onNotificationReceived(remoteMessage);
      }
    });

    // Listener cho khi app được mở từ notification (khi app đang background/quit)
    if (messaging) {
      messaging().onNotificationOpenedApp((remoteMessage: any) => {
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
        .then((remoteMessage: any) => {
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
    }

    // Listener cho expo-notifications (backup)
    let receivedListener: any = null;
    let responseListener: any = null;
    
    try {
      receivedListener = Notifications.addNotificationReceivedListener((notification: any) => {
        console.log('[PushNotifications] 📬 Expo Notification received:', {
          title: notification.request.content.title,
          body: notification.request.content.body,
          data: notification.request.content.data,
        });
      });

      responseListener = Notifications.addNotificationResponseReceivedListener((response: any) => {
        console.log('[PushNotifications] 👆 Expo Notification tapped:', {
          title: response.notification.request.content.title,
          body: response.notification.request.content.body,
          data: response.notification.request.content.data,
        });
        if (onNotificationTapped) {
          onNotificationTapped(response);
        }
      });
    } catch (error) {
      console.warn('[PushNotifications] Failed to setup expo-notifications listeners:', error);
    }

    // Return cleanup function
    return () => {
      if (unsubscribeForeground) {
        unsubscribeForeground();
      }
      if (receivedListener) {
        try {
          receivedListener.remove();
        } catch (error) {
          console.warn('[PushNotifications] Error removing received listener:', error);
        }
      }
      if (responseListener) {
        try {
          responseListener.remove();
        } catch (error) {
          console.warn('[PushNotifications] Error removing response listener:', error);
        }
      }
    };
  }

  /**
   * Kiểm tra notification khi app được mở từ notification (app đang closed)
   * Note: getLastNotificationResponseAsync chỉ khả dụng trên iOS
   */
  async checkInitialNotification(): Promise<any | null> {
    try {
      // Bỏ qua trên web
      if (Platform.OS === 'web') {
        return null;
      }

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

