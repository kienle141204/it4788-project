// components/TaskCard.tsx
import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { taskStyles } from '../styles/task.styles';

interface Task {
  project: string;
  title: string;
  time: string;
  status: 'Done' | 'In Progress' | 'To-do';
  category: 'shopping' | 'design' | 'sprint' | string;
}

interface TaskCardProps {
  task: Task;
}

interface IconConfig {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  backgroundColor: ViewStyle['backgroundColor'];
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const getStatusStyle = (status: Task['status']) => {
    switch (status) {
      case 'Done':
        return [taskStyles.statusBadge, taskStyles.statusDone];
      case 'In Progress':
        return [taskStyles.statusBadge, taskStyles.statusInProgress];
      case 'To-do':
        return [taskStyles.statusBadge, taskStyles.statusTodo];
      default:
        return [taskStyles.statusBadge, taskStyles.statusTodo];
    }
  };

  const getStatusTextStyle = (status: Task['status']) => {
    switch (status) {
      case 'Done':
        return [taskStyles.statusText, taskStyles.statusDoneText];
      case 'In Progress':
        return [taskStyles.statusText, taskStyles.statusInProgressText];
      case 'To-do':
        return [taskStyles.statusText, taskStyles.statusTodoText];
      default:
        return [taskStyles.statusText, taskStyles.statusTodoText];
    }
  };

  const getCategoryIcon = (category: string): IconConfig => {
    switch (category) {
      case 'shopping':
        return { 
          name: 'bag-outline', 
          color: '#FF6B9D',
          backgroundColor: taskStyles.categoryIconShopping.backgroundColor
        };
      case 'design':
        return { 
          name: 'color-palette-outline', 
          color: '#6C5CE7',
          backgroundColor: taskStyles.categoryIconDesign.backgroundColor
        };
      case 'sprint':
        return { 
          name: 'cube-outline', 
          color: '#FFA500',
          backgroundColor: taskStyles.categoryIconSprint.backgroundColor
        };
      default:
        return { 
          name: 'document-outline', 
          color: '#6C5CE7',
          backgroundColor: taskStyles.categoryIconDefault.backgroundColor
        };
    }
  };

  const icon = getCategoryIcon(task.category);

  return (
    <View style={taskStyles.taskCard}>
      <View style={taskStyles.taskHeader}>
        <Text style={taskStyles.taskProject}>{task.project}</Text>
        <View style={[taskStyles.categoryIcon, { backgroundColor: icon.backgroundColor }]}>
          <Ionicons name={icon.name} size={20} color={icon.color} />
        </View>
      </View>
      <Text style={taskStyles.taskTitle}>{task.title}</Text>
      <View style={taskStyles.taskFooter}>
        <View style={taskStyles.timeContainer}>
          <Ionicons name="time-outline" size={16} color="#6C5CE7" />
          <Text style={taskStyles.timeText}>{task.time}</Text>
        </View>
        <View style={getStatusStyle(task.status)}>
          <Text style={getStatusTextStyle(task.status)}>{task.status}</Text>
        </View>
      </View>
    </View>
  );
};

export default TaskCard;