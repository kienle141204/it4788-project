import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/themes';
import { homeStyles } from '../styles/home.styles';

interface HeaderProps {
  userName: string;
  onNotificationPress: () => void;
  onMenuPress: () => void;
}

export default function Header({ userName, onNotificationPress, onMenuPress }: HeaderProps) {
  return (
    <View style={homeStyles.header}>
      {/* Top bar */}
      <View style={homeStyles.topBar}>
        {/* User profile section */}
        <View style={homeStyles.userProfile}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face' }}
            style={homeStyles.profileImage}
          />
          <View style={homeStyles.userInfo}>
            <Text style={homeStyles.greeting}>Hello!</Text>
            <Text style={homeStyles.userName}>{userName}</Text>
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
