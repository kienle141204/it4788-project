import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/themes';
import { homeStyles } from '../styles/home.styles';

interface HeaderProps {
  userName?: string;
  avatarUrl?: string | null;
  onNotificationPress: () => void;
  onMenuPress: () => void;
}

const defaultAvatar = require('../assets/images/avatar.png');

export default function Header({ userName, avatarUrl, onNotificationPress, onMenuPress }: HeaderProps) {
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
            <Ionicons name="notifications-outline" size={24} color={COLORS.darkGrey} />
            <View style={homeStyles.notificationBadge} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onMenuPress}>
            <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.darkGrey} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
