import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io, { Socket } from 'socket.io-client';
import {
  NotificationItem,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/service/notifications';

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
        const baseUrl =
          Platform.OS === 'android'
            ? 'http://10.0.2.2:8090'
            : 'http://localhost:8090';

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
  }, []);

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


