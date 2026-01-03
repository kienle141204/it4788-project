import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { COLORS } from '../constants/themes';
import { homeStyles } from '../styles/home.styles';
import { useNotifications } from '@/context/NotificationsContext';
import { useExpiringItems } from '@/hooks/useExpiringItems';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
  userName?: string;
  avatarUrl?: string | null;
  onNotificationPress: () => void;
  onMenuPress: () => void;
}

const defaultAvatar = require('../assets/images/avatar.png');

export default function Header({ userName, avatarUrl, onNotificationPress, onMenuPress }: HeaderProps) {
  const { unreadCount } = useNotifications();
  const { expiringCount } = useExpiringItems();
  const insets = useSafeAreaInsets();

  // Animation values - start with visible to avoid flicker
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  const animateIn = () => {
    opacity.value = 0;
    translateY.value = -20;
    opacity.value = withTiming(1, { duration: 400 });
    translateY.value = withSpring(0, { damping: 15, stiffness: 100 });
  };

  useEffect(() => {
    animateIn();
  }, []);

  // Re-animate when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      animateIn();
    }, [])
  );

  // Animated style
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  // Chỉ hiển thị badge dựa trên unreadCount từ backend
  // Kiểm tra xem có notification về hết hạn không để đổi màu icon
  const hasExpiringNotifications = expiringCount.totalExpiring > 0 || expiringCount.totalExpired > 0;

  return (
    <Animated.View style={[styles.headerContainer, { marginTop: insets.top + 10 }, animatedStyle]}>
      <LinearGradient
        colors={['#6366f1', '#8b5cf6', '#a78bfa']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        {/* Decorative icon - chỉ 1 icon tinh tế */}
        <View style={styles.decorativeIcons}>
          <Ionicons name="sparkles" size={24} color="rgba(255,255,255,0.2)" style={styles.decorativeIcon1} />
        </View>

        {/* Top bar */}
        <View style={styles.topBar}>
          {/* User profile section */}
          <View style={styles.userProfile}>
            <View style={styles.profileImageContainer}>
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={styles.profileImage}
                />
              ) : (
                <Image
                  source={defaultAvatar}
                  style={styles.profileImage}
                />
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.greeting}>Hello!</Text>
              <Text style={styles.userName}>{userName || 'Người dùng'}</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={onNotificationPress} style={styles.notificationButton}>
              <View style={styles.notificationButtonBg}>
                <Ionicons
                  name={unreadCount > 0 ? "notifications" : "notifications-outline"}
                  size={24}
                  color={COLORS.white}
                />
                {unreadCount > 0 && (
                  <View style={[
                    styles.notificationBadge,
                    hasExpiringNotifications && {
                      backgroundColor: expiringCount.totalExpired > 0 ? COLORS.red : COLORS.orange,
                    }
                  ]}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  gradientBackground: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeIcons: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  decorativeIcon1: {
    position: 'absolute',
    top: 20,
    right: 60,
    opacity: 0.4,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    zIndex: 1,
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  profileImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  profileImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    marginBottom: 4,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  notificationButton: {
    position: 'relative',
    padding: 4,
  },
  notificationButtonBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    backgroundColor: COLORS.red,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  notificationBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
});
