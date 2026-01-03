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
let firebaseApp: any = null;

// Background message handler - PHẢI được định nghĩa ở top level
// React Native Firebase yêu cầu handler này phải được đăng ký trước khi app khởi động
async function handleBackgroundMessage(remoteMessage: any) {
  console.log('[PushNotifications] 📬 Background message received:', JSON.stringify(remoteMessage, null, 2));
  
  // Log vào inAppLogger để có thể xem trong app
  try {
    const { inAppLogger } = require('@/utils/logger');
    inAppLogger.log('📬 Background message received', 'PushNotifications');
    inAppLogger.log(`Title: ${remoteMessage.notification?.title || remoteMessage.data?.title || 'N/A'}`, 'PushNotifications');
    inAppLogger.log(`Body: ${remoteMessage.notification?.body || remoteMessage.data?.body || 'N/A'}`, 'PushNotifications');
  } catch (e) {
    // Ignore nếu logger không available
  }
  
  // Với hybrid message: có cả notification và data payload
  // Notification payload: đã được hệ thống hiển thị tự động
  // Data payload: để frontend có thể customize hoặc xử lý thêm
  
  // Lấy data từ message (ưu tiên data payload, fallback về notification payload)
  const title = remoteMessage.data?.title || remoteMessage.notification?.title || 'Thông báo mới';
  const body = remoteMessage.data?.body || remoteMessage.notification?.body || '';
  const imageUrl = remoteMessage.data?.image || remoteMessage.notification?.android?.imageUrl;
  
  console.log('[PushNotifications] 📝 Background notification data:', { 
    title, 
    body, 
    imageUrl,
    hasNotificationPayload: !!remoteMessage.notification,
    hasDataPayload: !!remoteMessage.data
  });
  
  // Với hybrid message có notification payload, hệ thống đã tự động hiển thị notification
  // Background handler chỉ cần log, không cần hiển thị lại (tránh duplicate)
  if (remoteMessage.notification) {
    console.log('[PushNotifications] ✅ Notification payload detected - system will display automatically');
    console.log('[PushNotifications] ℹ️ Skipping manual notification display to avoid duplicate');
    
    // Log vào inAppLogger
    try {
      const { inAppLogger } = require('@/utils/logger');
      inAppLogger.log('✅ Notification payload detected - system will display automatically', 'PushNotifications');
    } catch (e) {
      // Ignore
    }
    
    return; // Không cần hiển thị lại vì hệ thống đã tự động hiển thị
  }
  
  // Chỉ hiển thị thủ công nếu là data-only message (không có notification payload)
  console.log('[PushNotifications] ⚠️ Data-only message detected - displaying manually');
  
  // Load Notifee nếu chưa có
  let notifeeInstance: any = null;
  let AndroidImportanceInstance: any = null;
  let AndroidStyleInstance: any = null;
  
  try {
    if (Platform.OS === 'android') {
      const notifeeModule = require('@notifee/react-native');
      notifeeInstance = notifeeModule.default;
      AndroidImportanceInstance = notifeeModule.AndroidImportance;
      AndroidStyleInstance = notifeeModule.AndroidStyle;
    }
  } catch (error) {
    console.warn('[PushNotifications] ⚠️ Notifee not available in background handler');
  }
  
  // Hiển thị notification bằng Notifee (nếu có) hoặc expo-notifications
  let notificationDisplayed = false;
  
  if (notifeeInstance && Platform.OS === 'android') {
    try {
      console.log('[PushNotifications] 🔔 Attempting to display background notification with Notifee...');
      await notifeeInstance.displayNotification({
        title,
        body,
        data: remoteMessage.data || {},
        android: {
          channelId: 'chat_messages_v2',
          importance: AndroidImportanceInstance.HIGH,
          style: {
            type: AndroidStyleInstance.BIGTEXT,
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
      notificationDisplayed = true;
      console.log('[PushNotifications] ✅ Background notification displayed with Notifee');
    } catch (notifeeError: any) {
      console.error('[PushNotifications] ❌ Error displaying background notification with Notifee:', notifeeError?.message || notifeeError);
      
      // Fallback to expo-notifications
      try {
        console.log('[PushNotifications] 🔄 Falling back to expo-notifications for background...');
        const Notifications = require('expo-notifications').default;
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: remoteMessage.data || {},
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: null,
        });
        notificationDisplayed = true;
        console.log('[PushNotifications] ✅ Background notification displayed with expo-notifications (fallback)');
      } catch (expoError: any) {
        console.error('[PushNotifications] ❌ Error displaying background notification with expo-notifications:', expoError?.message || expoError);
      }
    }
  } else {
    // iOS hoặc không có Notifee - dùng expo-notifications
    try {
      console.log('[PushNotifications] 🔔 Displaying background notification with expo-notifications...');
      const Notifications = require('expo-notifications').default;
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: remoteMessage.data || {},
          sound: true,
        },
        trigger: null,
      });
      notificationDisplayed = true;
      console.log('[PushNotifications] ✅ Background notification displayed with expo-notifications');
    } catch (expoError: any) {
      console.error('[PushNotifications] ❌ Error displaying background notification:', expoError?.message || expoError);
    }
  }
  
  if (!notificationDisplayed) {
    console.error('[PushNotifications] ❌ CRITICAL: Background notification was NOT displayed!');
    
    // Log vào inAppLogger
    try {
      const { inAppLogger } = require('@/utils/logger');
      inAppLogger.log('❌ CRITICAL: Background notification was NOT displayed!', 'PushNotifications');
    } catch (e) {
      // Ignore
    }
  } else {
    // Log vào inAppLogger
    try {
      const { inAppLogger } = require('@/utils/logger');
      inAppLogger.log('✅ Background notification displayed successfully', 'PushNotifications');
    } catch (e) {
      // Ignore
    }
  }
}

try {
  // Kiểm tra xem có đang chạy trên Expo Go không
  let isExpoGo = false;
  try {
    const Constants = require('expo-constants');
    // Expo Go có executionEnvironment = 'storeClient'
    isExpoGo = Constants.executionEnvironment === 'storeClient';
    if (isExpoGo) {
      console.warn('[PushNotifications] ⚠️ Running on Expo Go - Push notifications will NOT work!');
      console.warn('[PushNotifications] ⚠️ Expo Go does not support @react-native-firebase/messaging');
      console.warn('[PushNotifications] ⚠️ You need to build a development build or production build to test push notifications');
      inAppLogger.log('⚠️ Running on Expo Go - Push notifications NOT supported', 'PushNotifications');
      inAppLogger.log('⚠️ Need to build development/production build to test', 'PushNotifications');
    }
  } catch (e) {
    // Ignore nếu không có expo-constants
  }

  // React Native Firebase chỉ hoạt động trên native platforms (iOS/Android)
  // Trên web hoặc Expo Go, bỏ qua Firebase Messaging
  if (Device.isDevice && Platform.OS !== 'web' && !isExpoGo) {
    // Khởi tạo Firebase App trước (nếu chưa có)
    try {
      const firebaseAppModule = require('@react-native-firebase/app');
      firebaseApp = firebaseAppModule.default;
      
      // Kiểm tra xem Firebase đã được khởi tạo chưa
      if (!firebaseApp.apps.length) {
        console.log('[PushNotifications] ⚠️ Firebase app not initialized, it should auto-initialize from google-services.json');
        inAppLogger.log('⚠️ Firebase app not initialized', 'PushNotifications');
      } else {
        console.log('[PushNotifications] ✅ Firebase app initialized');
        inAppLogger.log('✅ Firebase app initialized', 'PushNotifications');
      }
    } catch (firebaseAppError) {
      console.warn('[PushNotifications] ⚠️ Could not load Firebase App module:', firebaseAppError);
      inAppLogger.log('⚠️ Could not load Firebase App module', 'PushNotifications');
    }
    
    // Load Firebase Messaging
    try {
      messaging = require('@react-native-firebase/messaging').default;
      
      // Đăng ký background message handler
      // QUAN TRỌNG: Phải đăng ký ở top level, không được trong try-catch
      messaging().setBackgroundMessageHandler(handleBackgroundMessage);
      console.log('[PushNotifications] ✅ Background message handler registered');
      inAppLogger.log('✅ Background message handler registered', 'PushNotifications');
      
      console.log('[PushNotifications] ✅ Firebase Messaging initialized successfully');
      inAppLogger.log('✅ Firebase Messaging initialized successfully', 'PushNotifications');
    } catch (messagingError) {
      console.warn('[PushNotifications] ⚠️ Could not load Firebase Messaging:', messagingError);
      inAppLogger.log('⚠️ Could not load Firebase Messaging', 'PushNotifications');
    }
  } else if (isExpoGo) {
    console.warn('[PushNotifications] ⚠️ Skipping Firebase Messaging initialization (Expo Go detected)');
  }
} catch (error: any) {
  console.warn('[PushNotifications] ⚠️ Firebase Messaging not available:', error?.message || error);
  console.warn('[PushNotifications] ⚠️ This is normal if running on emulator/simulator, web, or Expo Go');
  inAppLogger.log(`⚠️ Firebase Messaging not available: ${error?.message || 'Unknown error'}`, 'PushNotifications');
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

    console.log('[PushNotifications] 🔧 Setting up Android notification channel...');
    inAppLogger.log('🔧 Setting up Android notification channel...', 'PushNotifications');

    if (!notifee) {
      console.warn('[PushNotifications] ⚠️ Notifee not available, using expo-notifications channel');
      inAppLogger.log('⚠️ Notifee not available, using expo-notifications channel', 'PushNotifications');
      // Fallback to expo-notifications
      try {
        await Notifications.setNotificationChannelAsync('chat_messages_v2', {
          name: 'Chat Messages',
          description: 'Notifications for chat messages',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });
        console.log('[PushNotifications] ✅ Android notification channel created with expo-notifications (fallback)');
        inAppLogger.log('✅ Android notification channel created with expo-notifications', 'PushNotifications');
      } catch (error: any) {
        console.warn('[PushNotifications] ⚠️ Failed to create Android notification channel:', error);
        inAppLogger.log(`❌ Failed to create channel: ${error?.message || 'Unknown error'}`, 'PushNotifications');
      }
      return;
    }

    try {
      // Thử xóa channel cũ nếu có (để đảm bảo cấu hình mới được áp dụng)
      // Lưu ý: Trên Android, channel chỉ có thể bị xóa nếu app chưa được cài đặt
      // Nhưng vẫn thử xóa để đảm bảo channel mới được tạo với cấu hình đúng
      try {
        await notifee.deleteChannel('chat_messages_v2');
        console.log('[PushNotifications] 🗑️ Deleted old channel (if existed)');
      } catch (deleteError) {
        // Bỏ qua lỗi xóa channel (có thể channel chưa tồn tại hoặc không thể xóa)
        console.log('[PushNotifications] ℹ️ Could not delete channel (this is normal if channel doesn\'t exist)');
      }

      // Tạo channel với Notifee
      await notifee.createChannel({
        id: 'chat_messages_v2',
        name: 'Chat Messages',
        description: 'Notifications for chat messages',
        importance: AndroidImportance.HIGH,
        vibration: true,
        vibrationPattern: [250, 250],
        sound: 'default',
        lights: true,
        lightColor: '#FF231F7C',
      });
      console.log('[PushNotifications] ✅ Android notification channel created with Notifee');
      inAppLogger.log('✅ Android notification channel created with Notifee', 'PushNotifications');
    } catch (error: any) {
      console.warn('[PushNotifications] ⚠️ Failed to create Android notification channel:', error);
      inAppLogger.log(`❌ Failed to create channel: ${error?.message || 'Unknown error'}`, 'PushNotifications');
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

      // Bỏ qua nếu là Web platform
      // if (Platform.OS === 'web') {
      //   console.warn('[PushNotifications] Web platform does not support Firebase push notifications');
      //   inAppLogger.log('⚠️ Running on Web - Push notifications disabled', 'PushNotifications');
      //   return null;
      // }

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
        console.warn('[PushNotifications] ❌ Firebase Messaging not available');
        inAppLogger.log('❌ Firebase Messaging not available - check if running on physical device', 'PushNotifications');
        return null;
      }
      
      // Đảm bảo Firebase đã sẵn sàng
      try {
        const messagingInstance = messaging();
        if (!messagingInstance) {
          console.warn('[PushNotifications] ❌ Firebase Messaging instance is null');
          return null;
        }
        
        const token = await messagingInstance.getToken();
      
        if (!token) {
          console.warn('[PushNotifications] ❌ No FCM token received from Firebase');
          inAppLogger.log('❌ No FCM token received - check Firebase configuration', 'PushNotifications');
          return null;
        }
        
        this.fcmToken = token;
        console.log('[PushNotifications] ✅ FCM Token obtained:', this.fcmToken?.substring(0, 50) + '...');
        console.log('[PushNotifications] 📱 Platform:', Platform.OS);
        console.log('[PushNotifications] 📱 Token length:', this.fcmToken?.length);
        inAppLogger.log(`✅ FCM Token obtained: ${this.fcmToken?.substring(0, 30)}...`, 'PushNotifications');
        inAppLogger.log(`📱 Platform: ${Platform.OS}`, 'PushNotifications');
        
        // Lắng nghe khi token được refresh
        try {
          messagingInstance.onTokenRefresh((newToken: string) => {
            console.log('[PushNotifications] 🔄 FCM Token refreshed:', newToken?.substring(0, 50) + '...');
            this.fcmToken = newToken;
            // Tự động đăng ký lại token mới với backend
            this.registerTokenWithBackend();
          });
        } catch (refreshError) {
          console.warn('[PushNotifications] ⚠️ Could not setup token refresh listener:', refreshError);
        }
        
        return this.fcmToken;
      } catch (tokenError: any) {
        console.error('[PushNotifications] ❌ Error getting FCM token:', tokenError);
        console.error('[PushNotifications] ❌ Error details:', tokenError?.message || 'Unknown error');
        inAppLogger.log(`❌ Error getting token: ${tokenError?.message || 'Unknown error'}`, 'PushNotifications');
        return null;
      }
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
      
      // Retry logic: thử lại tối đa 2 lần nếu lần đầu fail
      let lastError: any = null;
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries) {
        try {
          if (retryCount > 0) {
            console.log(`[PushNotifications] 🔄 Retry attempt ${retryCount}/${maxRetries}...`);
            inAppLogger.log(`🔄 Retry attempt ${retryCount}/${maxRetries}`, 'PushNotifications');
            // Đợi một chút trước khi retry
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
          
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
            const errorMsg = response?.message || response?.error || JSON.stringify(response) || 'Unknown error';
            lastError = new Error(errorMsg);
            console.error('[PushNotifications] ❌ Failed to register token. Response:', response);
            console.error('[PushNotifications] ❌ Response status:', response?.statusCode || 'unknown');
            console.error('[PushNotifications] ❌ Response message:', errorMsg);
            
            // Nếu là lỗi client (4xx), không retry
            if (response?.statusCode && response.statusCode >= 400 && response.statusCode < 500) {
              inAppLogger.log(`❌ Client error (${response.statusCode}): ${errorMsg}`, 'PushNotifications');
              return false;
            }
            
            // Nếu đã retry hết, return false
            if (retryCount >= maxRetries) {
              inAppLogger.log(`❌ Failed after ${maxRetries} retries: ${errorMsg}`, 'PushNotifications');
              return false;
            }
            
            retryCount++;
          }
        } catch (requestError: any) {
          lastError = requestError;
          console.error(`[PushNotifications] ❌ Error on attempt ${retryCount + 1}:`, requestError?.message);
          
          // Nếu là lỗi network và chưa retry hết, thử lại
          if (retryCount < maxRetries && (
            requestError?.code === 'NETWORK_ERROR' || 
            requestError?.message?.includes('network') ||
            requestError?.message?.includes('timeout')
          )) {
            retryCount++;
            continue;
          }
          
          // Nếu không phải network error hoặc đã retry hết, break
          break;
        }
      }
      
      // Nếu đến đây, tất cả retry đều fail
      if (lastError) {
        throw lastError;
      }
      return false;
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
    console.log('[PushNotifications] displayNotificationWithNotifee called:', { title, body, hasData: !!data, imageUrl });
    
    if (Platform.OS === 'android') {
      // Kiểm tra Notifee có sẵn không
      if (!notifee) {
        console.warn('[PushNotifications] ⚠️ Notifee not available, using expo-notifications fallback');
        // Fallback to expo-notifications
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title,
              body,
              data: data || {},
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: null,
          });
          console.log('[PushNotifications] ✅ Notification displayed with expo-notifications (fallback)');
        } catch (error: any) {
          console.error('[PushNotifications] ❌ Error with expo-notifications fallback:', error?.message || error);
          throw error;
        }
        return;
      }

      try {
        // Đảm bảo channel đã được tạo
        await this.setupAndroidNotificationChannel();
        
        console.log('[PushNotifications] 🔔 Displaying notification with Notifee...');
        await notifee.displayNotification({
          title,
          body,
          data: data || {},
          android: {
            channelId: 'chat_messages_v2',
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
            // Đảm bảo notification hiển thị
            showTimestamp: true,
            timestamp: Date.now(),
          },
        });
        console.log('[PushNotifications] ✅ Notification displayed successfully with Notifee');
      } catch (error: any) {
        console.error('[PushNotifications] ❌ Error displaying notification with Notifee:', error?.message || error);
        console.error('[PushNotifications] ❌ Error stack:', error?.stack);
        throw error;
      }
    } else {
      // iOS: vẫn dùng expo-notifications
      try {
        console.log('[PushNotifications] 🔔 Displaying iOS notification with expo-notifications...');
        const iosContent: any = {
          title,
          body,
          data: data || {},
          sound: true,
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
        console.log('[PushNotifications] ✅ iOS notification displayed successfully');
      } catch (error: any) {
        console.error('[PushNotifications] ❌ Error displaying iOS notification:', error?.message || error);
        throw error;
      }
    }
  }

  /**
   * Setup notification listeners cho FCM và Notifee
   */
  setupNotificationListeners(
    onNotificationReceived?: (notification: any) => void,
    onNotificationTapped?: (response: any) => void,
  ) {
    console.log('[PushNotifications] 🔧 Setting up notification listeners...');
    console.log('[PushNotifications] 📱 Device.isDevice:', Device.isDevice);
    console.log('[PushNotifications] 📱 Platform.OS:', Platform.OS);
    console.log('[PushNotifications] 📱 messaging available:', !!messaging);
    
    // Bỏ qua nếu không phải device thật, không có Firebase Messaging, hoặc đang chạy trên web
    if (!Device.isDevice || !messaging || Platform.OS === 'web') {
      console.warn('[PushNotifications] ⚠️ Skipping notification listeners setup (emulator/simulator/web or Firebase not available)');
      return () => {}; // Return empty cleanup function
    }
    
    console.log('[PushNotifications] ✅ Conditions met, proceeding with listener setup');

    // Setup Notifee foreground event handler cho Android
    if (Platform.OS === 'android' && notifee) {
      try {
        console.log('[PushNotifications] 🔧 Setting up Notifee foreground event handler...');
        notifee.onForegroundEvent(({ type, detail }: any) => {
          console.log('[PushNotifications] 📱 Notifee foreground event:', type, detail);
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
    console.log('[PushNotifications] 🔧 Registering foreground message handler...');
    inAppLogger.log('🔧 Registering foreground message handler...', 'PushNotifications');
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage: any) => {
      console.log('[PushNotifications] ========================================');
      console.log('[PushNotifications] 📬 FCM Message received (foreground)');
      console.log('[PushNotifications] ========================================');
      console.log('[PushNotifications] 📬 Full message:', JSON.stringify(remoteMessage, null, 2));
      
      // Log vào inAppLogger
      inAppLogger.log('📬 FCM Message received (foreground)', 'PushNotifications');
      inAppLogger.log(`Title: ${remoteMessage.notification?.title || remoteMessage.data?.title || 'N/A'}`, 'PushNotifications');
      inAppLogger.log(`Body: ${remoteMessage.notification?.body || remoteMessage.data?.body || 'N/A'}`, 'PushNotifications');
      
      // Với hybrid message: có cả notification và data payload
      // Khi app ở foreground, chúng ta có thể customize notification bằng Notifee
      // Lấy data từ message (ưu tiên data payload, fallback về notification payload)
      const title = remoteMessage.data?.title || remoteMessage.notification?.title || 'Thông báo mới';
      const body = remoteMessage.data?.body || remoteMessage.notification?.body || '';
      const imageUrl = remoteMessage.data?.image || remoteMessage.notification?.android?.imageUrl;

      console.log('[PushNotifications] 📝 Extracted notification data:', { 
        title, 
        body, 
        imageUrl, 
        hasData: !!remoteMessage.data,
        hasNotification: !!remoteMessage.notification
      });
      
      // Đảm bảo hiển thị notification
      let notificationDisplayed = false;
      
      try {
        console.log('[PushNotifications] 🔔 Attempting to display notification with Notifee...');
        await this.displayNotificationWithNotifee(title, body, remoteMessage.data, imageUrl);
        notificationDisplayed = true;
        console.log('[PushNotifications] ✅ Notification displayed successfully with Notifee');
      } catch (notifeeError: any) {
        console.error('[PushNotifications] ❌ Error displaying notification with Notifee:', notifeeError?.message || notifeeError);
        console.error('[PushNotifications] ❌ Notifee error details:', notifeeError);
        
        // Fallback to expo-notifications nếu Notifee fail
        try {
          console.log('[PushNotifications] 🔄 Falling back to expo-notifications...');
          await Notifications.scheduleNotificationAsync({
            content: {
              title,
              body,
              data: remoteMessage.data || {},
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: null,
          });
          notificationDisplayed = true;
          console.log('[PushNotifications] ✅ Notification displayed successfully with expo-notifications (fallback)');
        } catch (expoError: any) {
          console.error('[PushNotifications] ❌ Error displaying notification with expo-notifications:', expoError?.message || expoError);
          console.error('[PushNotifications] ❌ Both Notifee and expo-notifications failed!');
        }
      }
      
      if (!notificationDisplayed) {
        console.error('[PushNotifications] ❌ CRITICAL: Notification was NOT displayed!');
        inAppLogger.log('❌ CRITICAL: Notification received but NOT displayed!', 'PushNotifications');
      } else {
        inAppLogger.log('✅ Foreground notification displayed successfully', 'PushNotifications');
      }

      if (onNotificationReceived) {
        console.log('[PushNotifications] 📞 Calling onNotificationReceived callback...');
        onNotificationReceived(remoteMessage);
      }
      
      console.log('[PushNotifications] ========================================');
    });
    
    console.log('[PushNotifications] ✅ Foreground message handler registered');

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

      console.log('[PushNotifications] ✅ All notification listeners setup completed');
    
    // Return cleanup function
    return () => {
      console.log('[PushNotifications] 🧹 Cleaning up notification listeners...');
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
      console.log('[PushNotifications] ✅ Notification listeners cleaned up');
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

