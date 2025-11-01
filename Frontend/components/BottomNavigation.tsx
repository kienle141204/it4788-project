import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/themes';

interface BottomNavigationProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
}

export default function BottomNavigation({ activeTab, onTabPress }: BottomNavigationProps) {
  const tabs = [
    { id: 'home', icon: 'home-outline', activeIcon: 'home' },
    { id: 'calendar', icon: 'calendar-outline', activeIcon: 'calendar' },
    { id: 'document', icon: 'document-text-outline', activeIcon: 'document-text' },
    { id: 'people', icon: 'people-outline', activeIcon: 'people' }
  ];

  return (
    <View style={{
      backgroundColor: COLORS.purple,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 20,
      paddingVertical: 15,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center'
    }}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          onPress={() => onTabPress(tab.id)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: activeTab === tab.id ? COLORS.white : 'transparent',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Ionicons
            name={activeTab === tab.id ? tab.activeIcon as any : tab.icon as any}
            size={20}
            color={activeTab === tab.id ? COLORS.purple : COLORS.white}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}
