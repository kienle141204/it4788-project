import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io, { Socket } from 'socket.io-client';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import {
  NotificationItem,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/service/notifications';
import { pushNotificationService } from '@/service/pushNotifications';

interface NotificationsContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  refreshing: boolean;
  fetchNotifications: (page?: number) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await getUnreadNotificationCount();
      const data = res?.data || res;
      const count = typeof data.count === 'number' ? data.count : data?.data?.count || 0;
      setUnreadCount(count);
    } catch (error) {
      console.error('[Notifications] Error loading unread count:', error);
    }
  }, []);

  const fetchNotifications = useCallback(async (page = 1) => {
    try {
      if (page === 1) {
        setLoading(true);
      }
      const res = await getNotifications(page, 20);
      const items = res?.data || res;
      if (Array.isArray(items)) {
        setNotifications(items);
      } else if (Array.isArray(items.data)) {
        setNotifications(items.data);
      }
    } catch (error) {
      console.error('[Notifications] Error fetching notifications:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách thông báo. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchNotifications(1), loadUnreadCount()]);
  }, [fetchNotifications, loadUnreadCount]);

  const markAsRead = useCallback(
    async (id: number) => {
      try {
        await markNotificationAsRead(id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
        );
        // Giảm count nếu đang > 0
        setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));
      } catch (error) {
        console.error('[Notifications] Error marking as read:', error);
      }
    },
    [],
  );

  const markAllAsReadHandler = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('[Notifications] Error marking all as read:', error);
    }
  }, []);

  useEffect(() => {
    // Load lần đầu
    refreshNotifications();
  }, [refreshNotifications]);

  const router = useRouter();

  // Setup push notification listeners
  useEffect(() => {
    // Setup notification listeners
    const cleanup = pushNotificationService.setupNotificationListeners(
      // Khi nhận notification (app đang foreground)
      (notification) => {
        console.log('[Notifications] Push notification received:', notification);
        // Refresh notifications list
        refreshNotifications();
      },
      // Khi user tap vào notification
      (response) => {
        console.log('[Notifications] Push notification tapped:', response);
        const data = response.notification.request.content.data;

        // Navigate đến màn hình notifications
        router.push('/(notifications)');

        // Refresh notifications list
        refreshNotifications();

        // Nếu có notificationId, có thể mark as read
        if (data?.notificationId) {
          markAsRead(parseInt(data.notificationId));
        }
      },
    );

    // Kiểm tra notification khi app được mở từ notification (app đang closed)
    pushNotificationService.checkInitialNotification().then((notification) => {
      if (notification) {
        console.log('[Notifications] App opened from notification:', notification);
        router.push('/(notifications)');
        refreshNotifications();
      }
    });

    return cleanup;
  }, [router, refreshNotifications, markAsRead]);

  // Kết nối WebSocket để nhận realtime notifications nếu backend bật gateway
  useEffect(() => {
    let isMounted = true;

    const connectSocket = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        if (!token) {
          return;
        }
        const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;

        // Dùng cùng host với REST API nhưng namespace /notifications
<<<<<<< HEAD
        const baseUrl = 'https://it4788-project-ttac.onrender.com';
=======
        // Tự động chọn URL dựa trên API_DOMAIN (đồng bộ với api.tsx)
        const { API_DOMAIN } = await import('@/utils/api');
        const isProduction = API_DOMAIN.includes('render.com') || API_DOMAIN.includes('onrender.com');

        let baseUrl: string;
        if (isProduction) {
          // Production - sử dụng wss:// (secure WebSocket)
          baseUrl = 'wss://it4788-project-ttac.onrender.com';
        } else if (Platform.OS === 'android') {
          baseUrl = 'http://10.0.2.2:8090';
        } else {
          baseUrl = 'http://localhost:8090';
        }
>>>>>>> 963a64e07cbf036acbd6fe18c591c39168b60646

        const s = io(`${baseUrl}/notifications`, {
          transports: ['websocket'],
          auth: {
            token: cleanToken,
          },
        });

        s.on('connect', () => {
          console.log('[Notifications] WebSocket connected');
          s.emit('subscribe');
        });

        s.on('disconnect', () => {
          console.log('[Notifications] WebSocket disconnected');
        });

        s.on('new_notification', (notification: NotificationItem) => {
          setNotifications((prev) => [notification, ...prev]);
          // Cập nhật unread count
          loadUnreadCount();
        });

        s.on('unread_count', (data: { count: number }) => {
          if (typeof data?.count === 'number') {
            setUnreadCount(data.count);
          }
        });

        if (isMounted) {
          setSocket(s);
        }
      } catch (error) {
        console.error('[Notifications] Error connecting websocket:', error);
      }
    };

    connectSocket();

    return () => {
      isMounted = false;
      if (socket) {
        socket.disconnect();
      }
    };
  }, [loadUnreadCount]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refreshing,
        fetchNotifications,
        refreshNotifications,
        markAsRead,
        markAllAsRead: markAllAsReadHandler,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};


