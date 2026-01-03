import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { taskStyles } from '../styles/task.styles';
import { COLORS } from '../constants/themes';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface NavbarProps {
  title: string;
  onBack?: () => void;
  showNotification?: boolean;
  notificationCount?: number;
  onNotificationPress?: () => void;
  showMenu?: boolean;
  onMenuPress?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  title,
  onBack,
  showNotification = true,
  notificationCount = 0,
  onNotificationPress,
  showMenu = false,
  onMenuPress,
}) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[taskStyles.header, { paddingTop: insets.top + 10 }]}>
      {/* Back Button */}
      <TouchableOpacity 
        onPress={onBack} 
        style={taskStyles.backButton}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.darkGrey} />
      </TouchableOpacity>

      {/* Title */}
      <Text style={taskStyles.headerTitle}>{title}</Text>

      {/* Menu or Notification Button */}
      {showMenu ? (
        <TouchableOpacity 
          style={taskStyles.menuButton}
          onPress={onMenuPress}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-vertical" size={24} color={COLORS.darkGrey} />
        </TouchableOpacity>
      ) : showNotification ? (
        <TouchableOpacity 
          style={taskStyles.notificationButton}
          onPress={onNotificationPress}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications" size={24} color={COLORS.primary} />
          {notificationCount > 0 && (
            <View style={taskStyles.notificationBadge} />
          )}
        </TouchableOpacity>
      ) : (
        <View style={taskStyles.backButton} />
      )}
    </View>
  );
};

export default Navbar;