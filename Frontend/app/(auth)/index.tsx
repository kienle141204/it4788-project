import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { styles } from '@/styles/auth.styles'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import {COLORS} from '@/constants/themes'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { checkAsyncStorage } from '@/utils/checkAsyncStorage'

export default function login() {
    const route = useRouter()
    const nextPage = () => {
        route.push('/(auth)/login')
    }
    
    // Chỉ kiểm tra token, không tự động đăng nhập bằng vân tay
    useEffect(() => {
      const checkToken = async () => {
        const token = await checkAsyncStorage();
        if (token) {
          route.replace('/(market)/market_screen');
        }
      };
      checkToken();
    }, []);
    

  return (
    <>
    <View style={styles.container}>
        <View style = {styles.brandSection}>
            <View style={styles.logoContainer}>
                <Ionicons name='cart' size={32} color={COLORS.primary}/>
            </View>
            <Text style={styles.appName}>Đi chợ tiện lợi</Text>
            <Text style={styles.tagline}>Tối ưu thời gian của bạn</Text>
        </View>
        <View style={styles.illustrationContainer}>
            <Image 
                source={require('../../assets/images/logo.png')}
                style={styles.illustration}
                contentFit='cover'
            />
        </View>

        <View style={styles.loginSection}>
            <TouchableOpacity style={styles.nextStepButton} onPress={nextPage} activeOpacity={0.8}>
                <Text style={styles.nextStepText}>Tiếp theo</Text>
                <Ionicons name="arrow-forward" size={18} color={COLORS.white} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
        </View>
    </View>
    </>
  )
}