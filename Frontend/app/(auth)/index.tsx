import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { styles } from '@/styles/auth.styles'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import {COLORS} from '@/constants/themes'
import { Redirect } from 'expo-router'
import { useRouter } from 'expo-router'

export default function login() {
    const route = useRouter()

    const nextPage = () => {
        route.push('/(auth)/login')
    }


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

        <View >
            <TouchableOpacity style={styles.nextStepButton} onPress={nextPage} activeOpacity={0.9}>
            <Text style={styles.nextStepText}>Tiếp theo</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8, marginTop: 2 }} />
            </TouchableOpacity>


        </View>
    </View>
    </>
  )
}