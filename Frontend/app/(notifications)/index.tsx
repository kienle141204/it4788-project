import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNotifications } from '@/context/NotificationsContext';
import { COLORS } from '@/constants/themes';
import { homeStyles } from '@/styles/home.styles';
import {
  getUnreadNotifications,
  deleteNotification,
  deleteAllNotifications,
} from '@/service/notifications';

export default function NotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loading,
    refreshing,
    refreshNotifications,
    markAsRead,
  } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [localLoading, setLocalLoading] = useState(false);
  const [displayed, setDisplayed] = useState<any[] | null>(null);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home' as any);
    }
  };

  const data = useMemo(() => {
    if (displayed) return displayed;
    return notifications;
  }, [displayed, notifications]);

  const handleRefresh = useCallback(
    async (mode: 'all' | 'unread' = filter) => {
      if (mode === 'all') {
        await refreshNotifications();
        setDisplayed(null);
      } else {
        try {
          setLocalLoading(true);
          const res = await getUnreadNotifications(1, 50);
          const items = Array.isArray(res?.data)
            ? res.data
            : Array.isArray((res as any)?.data?.data)
            ? (res as any).data.data
            : [];
          setDisplayed(items);
        } finally {
          setLocalLoading(false);
        }
      }
    },
    [filter, refreshNotifications],
  );

  const handleChangeFilter = useCallback(
    async (value: 'all' | 'unread') => {
      setFilter(value);
      await handleRefresh(value);
    },
    [handleRefresh],
  );

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await deleteNotification(id);
        // Cập nhật danh sách hiện tại
        setDisplayed((prev) => (prev ? prev.filter((n) => n.id !== id) : null));
        await refreshNotifications();
        if (filter === 'unread') {
          await handleRefresh();
        }
      } catch (error) {
        console.error('Error deleting notification:', error);
      }
    },
    [filter, handleRefresh, refreshNotifications],
  );

  const handleDeleteAll = useCallback(async () => {
    try {
      await deleteAllNotifications();
      setDisplayed([]);
      await refreshNotifications();
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  }, [refreshNotifications]);

  // Hàm lấy icon dựa trên title của thông báo
  const getNotificationIcon = useCallback((title: string, body: string, isUnread: boolean) => {
    const titleLower = title.toLowerCase();
    const bodyLower = (body || '').toLowerCase();
    
    // Kiểm tra thông báo về hết hạn
    if (titleLower.includes('hết hạn') || titleLower.includes('hạn') || 
        bodyLower.includes('hết hạn') || bodyLower.includes('🚨') || bodyLower.includes('⚠️')) {
      return isUnread ? 'warning' : 'warning-outline';
    }
    
    if (titleLower.includes('nhóm') || titleLower.includes('group')) {
      return isUnread ? 'people' : 'people-outline';
    }
    if (titleLower.includes('khuyến mãi') || titleLower.includes('promotion')) {
      return isUnread ? 'pricetag' : 'pricetag-outline';
    }
    if (titleLower.includes('đơn hàng') || titleLower.includes('order')) {
      return isUnread ? 'bag' : 'bag-outline';
    }
    return isUnread ? 'notifications' : 'notifications-outline';
  }, []);

  const renderItem = useCallback(
    ({ item }: any) => {
      const isUnread = !item.is_read;
      const iconName = getNotificationIcon(item.title, item.body || '', isUnread);
      
      // Xác định màu cho thông báo hết hạn
      const isExpiringNotification = 
        item.title?.toLowerCase().includes('hết hạn') || 
        item.title?.toLowerCase().includes('hạn') ||
        item.body?.toLowerCase().includes('hết hạn') ||
        item.body?.includes('🚨') ||
        item.body?.includes('⚠️');
      
      const iconColor = isExpiringNotification 
        ? (isUnread ? COLORS.orange : COLORS.grey)
        : (isUnread ? COLORS.white : COLORS.grey);
      
      const iconBgColor = isExpiringNotification
        ? (isUnread ? '#FFF4E6' : '#F3F4F6')
        : (isUnread ? COLORS.purple : '#F3F4F6');
      // Màu nền xanh lá nhạt cho thông báo chưa đọc (giống thiết kế)
      const cardBgColor = isUnread ? '#ECFDF5' : COLORS.white;
      
      return (
        <TouchableOpacity
          style={{
            padding: 16,
            marginHorizontal: 16,
            marginBottom: 16,
            borderRadius: 16,
            backgroundColor: cardBgColor,
            flexDirection: 'row',
            alignItems: 'flex-start',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 2,
            borderWidth: 1,
            borderColor: isUnread ? 'transparent' : '#F3F4F6',
          }}
          onPress={() => {
            if (isUnread) {
              markAsRead(item.id);
            }
          }}
          activeOpacity={0.8}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: iconBgColor,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 16,
              shadowColor: isExpiringNotification ? COLORS.orange : COLORS.purple,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isUnread ? 0.2 : 0,
              shadowRadius: 4,
              elevation: isUnread ? 3 : 0,
            }}
          >
            <Ionicons
              name={iconName as any}
              size={20}
              color={iconColor}
            />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: isUnread ? COLORS.darkGrey : '#6B7280',
                  flex: 1,
                  marginRight: 8,
                }}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleDelete(item.id);
                }}
                style={{
                  padding: 4,
                  marginTop: -4,
                  marginRight: -4,
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons 
                  name="trash-outline" 
                  size={20} 
                  color={isUnread ? '#9CA3AF' : '#D1D5DB'} 
                />
              </TouchableOpacity>
            </View>
            {!!item.body && (
              <Text 
                style={{ 
                  fontSize: 12, 
                  color: isUnread ? '#6B7280' : '#9CA3AF', 
                  marginBottom: 8,
                  lineHeight: 16,
                }}
                numberOfLines={2}
              >
                {item.body}
              </Text>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="time-outline" size={12} color={isUnread ? '#9CA3AF' : '#D1D5DB'} />
              <Text style={{ fontSize: 10, color: isUnread ? '#9CA3AF' : '#D1D5DB', fontWeight: '500' }}>
                {new Date(item.created_at).toLocaleString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [handleDelete, markAsRead, getNotificationIcon],
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.white }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 20,
          paddingBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: '#F3F4F6',
        }}
      >
        <TouchableOpacity 
          onPress={handleBack} 
          style={{ 
            padding: 8,
            marginLeft: -8,
            borderRadius: 20,
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.darkGrey} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.darkGrey }}>
            Thông báo
          </Text>
        </View>
        <View style={{ width: 100, alignItems: 'flex-end' }}>
          {data.length > 0 && (
            <TouchableOpacity
              onPress={handleDeleteAll}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: '#FEE2E2',
              }}
            >
              <Ionicons name="trash-outline" size={16} color={COLORS.red || '#EF4444'} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.red || '#EF4444' }}>
                Xóa tất cả
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter tabs */}
      <View
        style={{
          flexDirection: 'row',
          marginHorizontal: 16,
          marginBottom: 24,
          marginTop: 16,
          borderRadius: 12,
          backgroundColor: COLORS.backgroundLight || '#F3F4F6',
          padding: 4,
        }}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: filter === 'all' ? COLORS.purple : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: filter === 'all' ? COLORS.purple : 'transparent',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: filter === 'all' ? 0.2 : 0,
            shadowRadius: 2,
            elevation: filter === 'all' ? 2 : 0,
          }}
          onPress={() => handleChangeFilter('all')}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: filter === 'all' ? COLORS.white : '#6B7280',
            }}
          >
            Tất cả
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: filter === 'unread' ? COLORS.purple : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: filter === 'unread' ? COLORS.purple : 'transparent',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: filter === 'unread' ? 0.2 : 0,
            shadowRadius: 2,
            elevation: filter === 'unread' ? 2 : 0,
          }}
          onPress={() => handleChangeFilter('unread')}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: filter === 'unread' ? COLORS.white : '#6B7280',
            }}
          >
            Chưa đọc
          </Text>
        </TouchableOpacity>
      </View>

      {localLoading || (loading && data.length === 0) ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.purple} />
          <Text style={{ marginTop: 12, color: COLORS.grey }}>Đang tải thông báo...</Text>
        </View>
      ) : data.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Ionicons name="notifications-off-outline" size={48} color={COLORS.grey} />
          <Text
            style={{
              marginTop: 16,
              fontSize: 16,
              fontWeight: '600',
              color: COLORS.darkGrey,
            }}
          >
            Chưa có thông báo
          </Text>
          <Text
            style={{
              marginTop: 8,
              fontSize: 14,
              color: COLORS.grey,
              textAlign: 'center',
            }}
          >
            Khi có hoạt động liên quan đến tài khoản, thông báo sẽ xuất hiện tại đây.
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || localLoading}
              onRefresh={handleRefresh}
              colors={[COLORS.purple]}
              tintColor={COLORS.purple}
            />
          }
          ListHeaderComponent={
            <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.darkGrey }}>
                  {filter === 'all' ? 'Tất cả thông báo' : 'Thông báo chưa đọc'}
                </Text>
                <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '500' }}>
                  Mới nhất
                </Text>
              </View>
            </View>
          }
        />
      )}
    </View>
  );
}


