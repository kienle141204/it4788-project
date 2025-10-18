import { View, Text } from 'react-native'
import React, { useEffect, useRef } from 'react';
import { BackHandler, ToastAndroid } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function index() {
  const navigation = useNavigation();
  const backPressCount = useRef(0);
  console.log('🏠 Đang ở HOME');
  useEffect(() => {
    const backAction = () => {
      // Nếu ấn 2 lần trong 2s → thoát app
      if (backPressCount.current === 0) {
        backPressCount.current += 1;
        ToastAndroid.show('Nhấn quay lại lần nữa để thoát ứng dụng', ToastAndroid.SHORT);

        setTimeout(() => {
          backPressCount.current = 0;
        }, 2000);
        return true; // chặn hành vi quay lại
      } else {
        BackHandler.exitApp(); // Thoát app
        return true;
      }
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  return (
    <View>
      <Text>index</Text>
    </View>
  )
}