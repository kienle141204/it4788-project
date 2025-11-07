import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { taskStyles } from '../styles/task.styles';

interface DateItem {
  day: number;
  weekday: string;
  month: string;
}

interface DateSelectorProps {
  selectedDate: number;
  onSelectDate: (day: number) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onSelectDate }) => {
  const dates: DateItem[] = [
    { day: 23, weekday: 'Fri', month: 'May' },
    { day: 24, weekday: 'Sat', month: 'May' },
    { day: 25, weekday: 'Sun', month: 'May' },
    { day: 26, weekday: 'Mon', month: 'May' },
    { day: 27, weekday: 'Tue', month: 'May' },
  ];

  return (
    <View style={taskStyles.dateContainer}>
      {dates.map((date, index) => (
        <TouchableOpacity
          key={index}
          style={[
            taskStyles.dateItem,
            selectedDate === date.day && taskStyles.dateItemSelected
          ]}
          onPress={() => onSelectDate(date.day)}
        >
          <Text style={[
            taskStyles.dateMonth,
            selectedDate === date.day && taskStyles.dateTextSelected
          ]}>
            {date.month}
          </Text>
          <Text style={[
            taskStyles.dateDay,
            selectedDate === date.day && taskStyles.dateDaySelected
          ]}>
            {date.day}
          </Text>
          <Text style={[
            taskStyles.dateWeekday,
            selectedDate === date.day && taskStyles.dateTextSelected
          ]}>
            {date.weekday}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default DateSelector;