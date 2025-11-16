import React, { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Navbar from '../../components/Navbar';
import DateSelector from '../../components/DateSelector';
import FilterTabs from '../../components/FilterTabs';
import TaskCard from '../../components/TaskCard';
import { taskStyles } from '../../styles/task.styles';

import BottomNavigation from '../../components/BottomNavigation';

interface Task {
  id: number;
  project: string;
  title: string;
  time: string;
  status: 'Done' | 'In Progress' | 'To-do';
  category: 'shopping' | 'design' | 'sprint';
}

export default function TaskPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<number>(25);
  const [activeTab, setActiveTab] = useState('task');

  // Sample tasks data
  const tasks: Task[] = [
    {
      id: 1,
      project: 'Grocery shopping app design',
      title: 'Market Research',
      time: '10:00 AM',
      status: 'Done',
      category: 'shopping'
    },
    {
      id: 2,
      project: 'Grocery shopping app design',
      title: 'Competitive Analysis',
      time: '12:00 PM',
      status: 'In Progress',
      category: 'shopping'
    },
    {
      id: 3,
      project: 'Uber Eats redesign challenge',
      title: 'Create Low-fidelity Wireframe',
      time: '07:00 PM',
      status: 'To-do',
      category: 'design'
    },
    {
      id: 4,
      project: 'About design sprint',
      title: 'How to pitch a Design Sprint',
      time: '09:00 PM',
      status: 'To-do',
      category: 'sprint'
    }
  ];

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      console.log('No previous screen');
    }
  };
    const handleTabPress = (tab: string) => {
        setActiveTab(tab);
        if (tab === 'add') {
        Alert.alert('Thêm mới', 'Tạo nội dung mới');
        }
    };

  const handleNotificationPress = () => {
    console.log('Notification pressed');
    // router.push('/notifications');
  };

  const handleDateSelect = (date: number) => {
    setSelectedDate(date);
    console.log('Selected date:', date);
  };

  const handleTabSelect = (tab: string) => {
    setActiveTab(tab);
    console.log('Selected tab:', tab);
  };

  return (
    <View style={taskStyles.container}>
      {/* Navbar */}
      <Navbar 
        title="Today's Tasks" 
        onBack={handleBack}
        showNotification={true}
        notificationCount={1}
        onNotificationPress={handleNotificationPress}
      />
      
      {/* Content */}
      <ScrollView 
        style={taskStyles.content} 
        showsVerticalScrollIndicator={false}
      >
        {/* Date Selector */}
        <DateSelector 
          selectedDate={selectedDate} 
          onSelectDate={handleDateSelect} 
        />
        
        {/* Filter Tabs */}
        <FilterTabs 
          activeTab={activeTab} 
          onSelectTab={handleTabSelect} 
        />
        
        {/* Task List */}
        <View style={taskStyles.taskList}>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </View>
      </ScrollView>
      {/* Bottom Navigation */}
        <BottomNavigation
        activeTab={activeTab}
        onTabPress={handleTabPress}
        />
    </View>
  );
}