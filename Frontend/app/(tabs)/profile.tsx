import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAccess, logoutUser } from '@/utils/api';
import { styles } from '@/styles/profile.styles';
import { COLORS } from '@/constants/themes';

interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  avatar_url?: string;
  address?: string;
  phone?: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAccess('auth/profile');
      setProfile(data);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Không thể tải thông tin hồ sơ');
      if (err.message === 'SESSION_EXPIRED') {
        Alert.alert('Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại', [
          { text: 'OK', onPress: () => router.replace('/(auth)') }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    router.push('/(auth)/updata_profile');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            try {
              await logoutUser();
              router.replace('/(auth)');
            } catch (err) {
              console.error('Logout error:', err);
              Alert.alert('Lỗi', 'Không thể đăng xuất. Vui lòng thử lại.');
            }
          },
        },
      ]
    );
  };

  const handleSettings = () => {
    Alert.alert('Cài đặt', 'Chức năng cài đặt đang được phát triển');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.red} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={
                profile.avatar_url
                  ? { uri: profile.avatar_url }
                  : require('@/assets/images/avatar.png')
              }
              style={styles.avatar}
            />
            <View style={styles.rolebadge}>
              <Text style={styles.roleBadgeText}>
                {profile.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
              </Text>
            </View>
          </View>
          <Text style={styles.userName}>{profile.full_name || 'Chưa cập nhật'}</Text>
          <Text style={styles.userEmail}>{profile.email}</Text>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={24} color={COLORS.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Họ và tên</Text>
                <Text style={styles.infoValue}>{profile.full_name || 'Chưa cập nhật'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={24} color={COLORS.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{profile.email}</Text>
              </View>
            </View>

            {profile.phone && (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={24} color={COLORS.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Số điện thoại</Text>
                  <Text style={styles.infoValue}>{profile.phone}</Text>
                </View>
              </View>
            )}

            {profile.address && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={24} color={COLORS.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Địa chỉ</Text>
                  <Text style={styles.infoValue}>{profile.address}</Text>
                </View>
              </View>
            )}

            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={24} color={COLORS.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Ngày tham gia</Text>
                <Text style={styles.infoValue}>
                  {new Date(profile.created_at).toLocaleDateString('vi-VN')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Actions Section */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Hành động</Text>

          <TouchableOpacity style={styles.actionButton} onPress={handleEditProfile}>
            <View style={styles.actionButtonContent}>
              <Ionicons name="create-outline" size={24} color={COLORS.primary} />
              <Text style={styles.actionButtonText}>Chỉnh sửa hồ sơ</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.grey} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleSettings}>
            <View style={styles.actionButtonContent}>
              <Ionicons name="settings-outline" size={24} color={COLORS.primary} />
              <Text style={styles.actionButtonText}>Cài đặt</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.grey} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.logoutButton]} 
            onPress={handleLogout}
          >
            <View style={styles.actionButtonContent}>
              <Ionicons name="log-out-outline" size={24} color={COLORS.red} />
              <Text style={[styles.actionButtonText, styles.logoutText]}>Đăng xuất</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.grey} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

