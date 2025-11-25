import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { taskStyles } from '../styles/task.styles';

interface FilterTabsProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

const FilterTabs: React.FC<FilterTabsProps> = ({ activeTab, onSelectTab }) => {
  const tabs = [
    { id: 'shopping', label: 'Danh sách mua sắm' },
    { id: 'members', label: 'Thành viên nhóm' }
  ];

  return (
    <View style={taskStyles.tabContainer}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            taskStyles.tab,
            activeTab === tab.id && taskStyles.tabActive
          ]}
          onPress={() => onSelectTab(tab.id)}
        >
          <Text style={[
            taskStyles.tabText,
            activeTab === tab.id && taskStyles.tabTextActive
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default FilterTabs;