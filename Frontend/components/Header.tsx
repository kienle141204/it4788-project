import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/themes';
import { homeStyles } from '../styles/home.styles';
import { useNotifications } from '@/context/NotificationsContext';

interface HeaderProps {
  userName?: string;
  avatarUrl?: string | null;
  onNotificationPress: () => void;
  onMenuPress: () => void;
}

const defaultAvatar = require('../assets/images/avatar.png');

export default function Header({ userName, avatarUrl, onNotificationPress, onMenuPress }: HeaderProps) {
  const { unreadCount } = useNotifications();

  return (
    <View style={homeStyles.header}>
      {/* Top bar */}
      <View style={homeStyles.topBar}>
        {/* User profile section */}
        <View style={homeStyles.userProfile}>
          <View style={homeStyles.profileImageContainer}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={homeStyles.profileImage}
              />
            ) : (
              <Image
                source={defaultAvatar}
                style={homeStyles.profileImage}
              />
            )}
          </View>
          <View style={homeStyles.userInfo}>
            <Text style={homeStyles.greeting}>Hello!</Text>
            <Text style={homeStyles.userName}>{userName || 'Người dùng'}</Text>
          </View>
        </View>
        <View style={homeStyles.headerActions}>
          <TouchableOpacity onPress={onNotificationPress} style={homeStyles.notificationButton}>
            <Ionicons
              name={unreadCount > 0 ? "notifications" : "notifications-outline"}
              size={24}
              color={COLORS.darkGrey}
            />
            {unreadCount > 0 && (
              <View style={homeStyles.notificationBadge}>
                <Text style={homeStyles.notificationBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={onMenuPress}>
            <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.darkGrey} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
