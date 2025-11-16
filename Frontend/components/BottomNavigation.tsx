import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
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
    { id: 'add', icon: 'add', activeIcon: 'add' }, 
    { id: 'document', icon: 'document-text-outline', activeIcon: 'document-text' },
    { id: 'people', icon: 'people-outline', activeIcon: 'people' }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.navigation}>
        {tabs.map((tab) => {
          if (tab.id === 'add') {
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => onTabPress(tab.id)}
                style={styles.addButton}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={28}
                  color={COLORS.white}
                />
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => onTabPress(tab.id)}
              style={styles.tabButton}
            >
              <Ionicons
                name={activeTab === tab.id ? tab.activeIcon as any : tab.icon as any}
                size={24}
                color={activeTab === tab.id ? COLORS.purple : COLORS.grey}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    zIndex: 999, 
  },
  navigation: {
    backgroundColor: COLORS.backgroundLight || COLORS.white,
    paddingHorizontal: 5,
    paddingVertical: 5,
    paddingBottom: 5,
    flexDirection: 'row',
    justifyContent: 'space-around', 
    alignItems: 'center',
    shadowColor: COLORS.shadow || '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  tabButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1, 
    maxWidth: 70, 
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.purple,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    marginTop: -50, // Nhô lên so với các nút khác
    zIndex: 10,
  },
});