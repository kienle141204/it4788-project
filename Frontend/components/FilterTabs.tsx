// components/FilterTabs.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { taskStyles } from '../styles/task.styles';

interface FilterTabsProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

const FilterTabs: React.FC<FilterTabsProps> = ({ activeTab, onSelectTab }) => {
  const tabs = ['All', 'MyTask', 'GroupTask', 'Completed'];

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={taskStyles.tabContainer}
    >
      {tabs.map((tab, index) => (
        <TouchableOpacity
          key={index}
          style={[
            taskStyles.tab,
            activeTab === tab && taskStyles.tabActive
          ]}
          onPress={() => onSelectTab(tab)}
        >
          <Text style={[
            taskStyles.tabText,
            activeTab === tab && taskStyles.tabTextActive
          ]}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default FilterTabs;