import { View, Text } from 'react-native'
import React from 'react'
import { styles } from '@/styles/auth.styles'
import { TextInput } from 'react-native'
import { COLORS } from '@/constants/themes'
import { useState } from 'react'
import { Link } from 'expo-router'
import { TouchableOpacity, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

export default function login() {
  const [isFocused, setIsFocused] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const route = useRouter()

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    Alert.alert('Thông tin đăng nhập', `Email: ${email}\nPassword: ${password}`)
    route.push('/(auth)/verify')
  };

  return (
    <View style={styles.container}>
      <View style={styles.brandSection}>
        <View>
            <Text style={styles.appName}>Đăng nhập</Text>
        </View>
        
        <View style={styles.label}>
            <Text style={styles.labelText}> Email của bạn</Text>
        </View>
        <View style={styles.inputContainer}>
            <TextInput        
             style={[styles.input, isFocused && styles.inputFocused]}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)} 
            placeholder='Nhập email của bạn' 
            selectionColor={COLORS.primary}
            value={email}
            onChangeText={setEmail}
            placeholderTextColor={COLORS.primary} />
        </View>
        
        <View style={styles.label}>
            <Text style={styles.labelText}> Mật khẩu</Text>
        </View>
        <View style={styles.inputContainer}>
            <TextInput        
            style={[styles.input, isFocused && styles.inputFocused]}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)} 
            placeholder='Nhập mật khẩu của bạn' 
            secureTextEntry
            selectionColor={COLORS.primary}
            placeholderTextColor={COLORS.primary}
            value={password}
            onChangeText={setPassword} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '80%', marginTop: 15 }}>
            <Link href="/forgotPassword" style={{ color: COLORS.primary }}>
                Quên mật khẩu?
            </Link>
            <Link href="/register" style={{ color: COLORS.primary }}>
                Bạn chưa có tài khoản?
            </Link>
        </View >
        <View style={styles.loginButton}>
            <TouchableOpacity  onPress={handleLogin}>
                <Text style={styles.loginButtonText}>Đăng nhập</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.dividerContainer}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>Đăng nhập bằng cách khác</Text>
            <View style={styles.line} />
        </View>
        <View style={styles.loginSection}>
            <TouchableOpacity
                style = {styles.googleButton}
                activeOpacity={0.9}
            >
                <View style={styles.googleIconContainer}>
                    <Ionicons name='logo-google' size={20} color = {COLORS.orange}/>

                </View>
                <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>
                        <TouchableOpacity
                style = {styles.googleButton}
                activeOpacity={0.9}
            >
                <View style={styles.googleIconContainer}>
                    <Ionicons name='logo-facebook' size={24} color = {COLORS.blue}/>

                </View>
                <Text style={styles.facebookButtonText}>Continue with Facebook</Text>
            </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}