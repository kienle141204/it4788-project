import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { COLORS } from '@/constants/themes';
import { getAccess, logoutUser } from '@/utils/api';
import ActionMenu from '@/components/ActionMenu';

type UserProfile = {
  id: number;
  email: string;
  full_name?: string;
  fullname?: string;
  avatar_url: string | null;
  address: string | null;
  phone: string | null;
  role: string;
  created_at: string;
  updated_at: string;
};

const defaultAvatar = require('../../assets/images/avatar.png');

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const fetchProfile = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await getAccess('auth/profile');
      // API response có cấu trúc: { success, message, data: { ...userInfo } }
      const userData = response?.data || response;
      setProfile(userData);
    } catch (err: any) {
      const message =
        err instanceof Error && err.message === 'SESSION_EXPIRED'
          ? 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.'
          : 'Không thể tải thông tin, vui lòng thử lại.';
      setError(message);
    } finally {
      if (!silent) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  }, []);

  // Lần đầu mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Khi màn hình được focus lại (khi chuyển tab)
  useFocusEffect(
    useCallback(() => {
      fetchProfile(true);
    }, [fetchProfile])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile(true);
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            try {
              await logoutUser();
              router.replace('/(auth)' as any);
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể đăng xuất, vui lòng thử lại.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const formatDate = (value: string | undefined) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary || COLORS.purple} />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchProfile()}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!profile) {
      return null;
    }

    return (
      <>
        <View style={styles.profileCard}>
          <Image
            source={profile.avatar_url ? { uri: profile.avatar_url } : defaultAvatar}
            style={styles.avatar}
          />
          <Text style={styles.nameText}>{profile.full_name || profile.fullname || 'Không có tên'}</Text>
          <Text style={styles.emailText}>{profile.email}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark" size={16} color={COLORS.white} />
            <Text style={styles.roleText}>{profile.role}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
          <InfoRow icon="mail-outline" label="Email" value={profile.email} />
          <InfoRow icon="call-outline" label="Số điện thoại" value={profile.phone || 'Chưa cập nhật'} />
          <InfoRow icon="location-outline" label="Địa chỉ" value={profile.address || 'Chưa cập nhật'} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hoạt động</Text>
          <InfoRow icon="calendar-outline" label="Ngày tạo" value={formatDate(profile.created_at)} />
          <InfoRow icon="time-outline" label="Cập nhật gần nhất" value={formatDate(profile.updated_at)} />
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Trang cá nhân</Text>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setMenuVisible(true)}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={COLORS.darkGrey} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {renderContent()}
      </ScrollView>

      <ActionMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        title="Tùy chọn tài khoản"
        options={[
          {
            label: 'Sửa thông tin cá nhân',
            icon: 'create-outline',
            onPress: () => {
              setMenuVisible(false);
              router.push('/(profile)/edit');
            },
          },
          {
            label: 'Khóa bảo vệ tài khoản',
            icon: 'lock-closed-outline',
            onPress: () => {
              Alert.alert(
                'Khóa bảo vệ',
                'Tính năng khóa bảo vệ tài khoản sẽ được triển khai.',
              );
            },
          },
          {
            label: 'Debug Push Notification',
            icon: 'bug-outline',
            onPress: () => {
              router.push('/(profile)/debug-push' as any);
            },
          },
          {
            label: 'Đăng xuất',
            icon: 'log-out-outline',
            destructive: true,
            onPress: handleLogout,
          },
        ]}
      />
    </SafeAreaView>
  );
}

type InfoRowProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
};

const InfoRow = ({ icon, label, value }: InfoRowProps) => (
  <View style={styles.infoRow}>
    <View style={styles.iconWrapper}>
      <Ionicons name={icon} size={18} color={COLORS.primary || COLORS.purple} />
    </View>
    <View style={styles.infoText}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background || '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerSpacer: {
    width: 36,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.darkGrey,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 16,
  },
  nameText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.darkGrey,
  },
  emailText: {
    fontSize: 14,
    color: COLORS.grey,
    marginTop: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary || COLORS.purple,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 12,
    gap: 6,
  },
  roleText: {
    color: COLORS.white,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGrey,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.grey,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: COLORS.darkGrey,
    fontWeight: '500',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.grey,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 12,
    color: '#EF4444',
    fontSize: 14,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.primary || COLORS.purple,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: '600',
  },
});
