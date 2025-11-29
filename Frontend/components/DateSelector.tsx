import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { taskStyles } from '../styles/task.styles';
import { COLORS } from '../constants/themes';

interface DateItem {
  day: number;
  weekday: string;
  isToday: boolean;
  date: Date;
}

interface DateSelectorProps {
  selectedDate: number;
  onSelectDate: (day: number) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onSelectDate }) => {
  const [dateOffset, setDateOffset] = useState(0);

  const getWeekdayShort = (date: Date): string => {
    const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return weekdays[date.getDay()];
  };

  const dates: DateItem[] = useMemo(() => {
    const today = new Date();
    const result: DateItem[] = [];
    
    // Generate dates: 2 days before, today, and 2 days after (based on offset)
    for (let i = -2; i <= 2; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + dateOffset + i);
      
      const isToday = 
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
      
      result.push({
        day: date.getDate(),
        weekday: getWeekdayShort(date),
        isToday,
        date,
      });
    }
    
    return result;
  }, [dateOffset]);

  const handlePrevious = () => {
    setDateOffset(prev => prev - 1);
  };

  const handleNext = () => {
    setDateOffset(prev => prev + 1);
  };

  const handleDatePress = (date: DateItem) => {
    onSelectDate(date.date.getDate());
  };

  return (
    <View style={taskStyles.dateContainer}>
      <TouchableOpacity 
        style={taskStyles.dateNavButton}
        onPress={handlePrevious}
      >
        <Ionicons name="chevron-back" size={20} color={COLORS.darkGrey} />
      </TouchableOpacity>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={taskStyles.dateScrollContent}
      >
        {dates.map((date, index) => {
          const isSelected = selectedDate === date.day;
          return (
            <TouchableOpacity
              key={`${date.date.getTime()}-${index}`}
              style={[
                taskStyles.dateItem,
                isSelected && taskStyles.dateItemSelected
              ]}
              onPress={() => handleDatePress(date)}
            >
              <Text style={[
                taskStyles.dateWeekday,
                isSelected && taskStyles.dateTextSelected
              ]}>
                {date.isToday ? 'Hôm nay' : date.weekday}
              </Text>
              <Text style={[
                taskStyles.dateDay,
                isSelected && taskStyles.dateDaySelected
              ]}>
                {date.day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity 
        style={taskStyles.dateNavButton}
        onPress={handleNext}
      >
        <Ionicons name="chevron-forward" size={20} color={COLORS.darkGrey} />
      </TouchableOpacity>
    </View>
  );
};

export default DateSelector;