import { View, Text, ActivityIndicator } from 'react-native'
import React from 'react'
import { styles } from '@/styles/auth.styles'
import { TextInput } from 'react-native'
import { COLORS } from '@/constants/themes'
import { useState, useEffect } from 'react'
import { Link } from 'expo-router'
import { TouchableOpacity, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { loginUSer } from '@/service/auth'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkAsyncStorage } from '@/utils/checkAsyncStorage'
import { pushNotificationService } from '@/service/pushNotifications'
import { inAppLogger } from '@/utils/logger';

export default function login() {
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const route = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin!');
      return;
    }
    setLoading(true)
    try {
      const data = { email, password };

      const res = await loginUSer(data);
      
      // Check if response exists and has error
      if (!res) {
        Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ');
        return;
      }
      
      let message = res?.message;
      if (res?.statusCode) {
        if (Array.isArray(message)) {
          message = message.join('\n'); // Ghép mảng lại thành 1 chuỗi
        }

        Alert.alert('Lỗi', message || 'Đăng nhập thất bại');
        return;
      }

      const access = res?.access_token
      const refresh = res?.refresh_token
      
      await AsyncStorage.setItem('access_token', access as any)
      await AsyncStorage.setItem('refresh_token', refresh as any)
      const key = await AsyncStorage.getAllKeys()
      
      // Đăng ký push notification token sau khi đăng nhập thành công
      console.log('[Login] 🔔 Attempting to register push notification token...');
      inAppLogger.log('🔔 Attempting to register push notification token...', 'Login');
      try {
        const registered = await pushNotificationService.registerTokenWithBackend();
        if (registered) {
          console.log('[Login] ✅ Push notification token registered successfully');
          inAppLogger.log('✅ Push notification token registered successfully', 'Login');
        } else {
          console.warn('[Login] ⚠️ Push notification token registration failed (check logs above)');
          inAppLogger.log('⚠️ Push notification token registration failed', 'Login');
          // Không block login flow, nhưng log để debug
        }
      } catch (error: any) {
        console.error('[Login] ❌ Error registering push notification token:', error);
        console.error('[Login] ❌ Error details:', error?.message || 'Unknown error');
        inAppLogger.log(`❌ Error: ${error?.message || 'Unknown error'}`, 'Login');
        // Không block login flow nếu đăng ký token fail
      }
      
      route.push('../(tabs)/home');
    } catch (error) {
      Alert.alert('Lỗi', 'Đăng nhập thất bại, vui lòng thử lại sau.');
    } finally{
      setLoading(false)
    }
  };


  return (
    <View style={styles.container}>
      <View style={styles.brandSection}>
        <View>
            <Text style={styles.appName}>Đăng nhập</Text>
        </View>
        
        <View style={styles.label}>
            <Text style={styles.labelText}>Email của bạn</Text>
        </View>
        <View style={[styles.inputWrapper, focusedInput === 'email' && styles.inputFocused]}>
            <Ionicons name="mail-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
            <TextInput        
                style={styles.inputInner}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)} 
                placeholder='Nhập email của bạn' 
                placeholderTextColor={COLORS.grey}
                selectionColor={COLORS.primary}
                value={email}
                keyboardType='email-address'
                autoCapitalize='none'
                onChangeText={setEmail} />
        </View>
        
        <View style={styles.label}>
            <Text style={styles.labelText}>Mật khẩu</Text>
        </View>
        <View style={[styles.inputWrapper, focusedInput === 'password' && styles.inputFocused]}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
            <TextInput        
                style={styles.inputInner}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)} 
                placeholder='Nhập mật khẩu của bạn' 
                placeholderTextColor={COLORS.grey}
                secureTextEntry
                selectionColor={COLORS.primary}
                value={password}
                onChangeText={setPassword} />
        </View>
        <View style={styles.linkContainer}>
            <Link href="/forgotPassword" style={styles.linkText}>
                Quên mật khẩu?
            </Link>
            <Link href="/register" style={styles.linkText}>
                Bạn chưa có tài khoản?
            </Link>
        </View >
        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={handleLogin}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.loginButtonText}>Đăng nhập</Text>
          )}
        </TouchableOpacity>

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