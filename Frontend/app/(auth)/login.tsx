import { View, Text, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
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
import { biometricService } from '@/service/biometric';

export default function login() {
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const route = useRouter()
  const [loading, setLoading] = useState(false)
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  // Kiểm tra hỗ trợ và trạng thái đăng nhập bằng vân tay
  useEffect(() => {
    const checkBiometric = async () => {
      try {
        const supported = await biometricService.isSupported();
        const enrolled = await biometricService.isEnrolled();
        const enabled = await biometricService.isBiometricEnabled();
        
        setBiometricSupported(supported && enrolled);
        setBiometricEnabled(enabled);

        // Nếu đã bật và có email đã lưu, tự động điền email
        if (enabled) {
          const savedEmail = await biometricService.getSavedEmail();
          if (savedEmail) {
            setEmail(savedEmail);
          }
        }
      } catch (error) {
        console.error('[Login] Error checking biometric:', error);
      }
    };

    checkBiometric();
  }, []);

  // Xử lý đăng nhập bằng vân tay
  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    try {
      // Xác thực sinh trắc học
      const authResult = await biometricService.authenticate('Xác thực để đăng nhập');
      
      if (!authResult.success) {
        // Không hiển thị alert nếu người dùng hủy
        if (authResult.error && !authResult.error.includes('hủy')) {
          Alert.alert('Lỗi', authResult.error);
        }
        return;
      }

      // Lấy thông tin đăng nhập đã lưu
      const savedEmail = await biometricService.getSavedEmail();
      const savedPassword = await biometricService.getSavedPassword();

      if (!savedEmail || !savedPassword) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin đăng nhập đã lưu');
        return;
      }

      // Đăng nhập với thông tin đã lưu
      setEmail(savedEmail);
      setPassword(savedPassword);
      
      // Gọi handleLogin với thông tin đã lưu
      const data = { email: savedEmail, password: savedPassword };
      const res = await loginUSer(data);

      if (!res) {
        Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ');
        return;
      }

      let message = res?.message;
      if (res?.statusCode) {
        if (Array.isArray(message)) {
          message = message.join('\n');
        }
        Alert.alert('Lỗi', message || 'Đăng nhập thất bại');
        return;
      }

      const access = res?.access_token;
      const refresh = res?.refresh_token;

      await AsyncStorage.setItem('access_token', access as any);
      await AsyncStorage.setItem('refresh_token', refresh as any);

      // Đăng ký push notification token (không hiển thị lỗi nếu thất bại)
      try {
        await pushNotificationService.registerTokenWithBackend();
      } catch (error: any) {
        console.warn('[Login] Push notification registration failed:', error?.message);
        inAppLogger.log(`⚠️ Push notification registration failed: ${error?.message || 'Unknown error'}`, 'Login');
      }

      route.push('../(tabs)/home');
    } catch (error: any) {
      console.error('[Login] Biometric login error:', error);
      Alert.alert('Lỗi', 'Đăng nhập bằng vân tay thất bại, vui lòng thử lại.');
    } finally {
      setBiometricLoading(false);
    }
  };

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
      
      // Đăng ký push notification token sau khi đăng nhập thành công (không hiển thị lỗi nếu thất bại)
      try {
        await pushNotificationService.registerTokenWithBackend();
      } catch (error: any) {
        console.warn('[Login] Push notification registration failed:', error?.message);
        inAppLogger.log(`⚠️ Push notification registration failed: ${error?.message || 'Unknown error'}`, 'Login');
      }

      // Hỏi người dùng có muốn bật đăng nhập bằng vân tay không
      if (biometricSupported && !biometricEnabled) {
        Alert.alert(
          'Bật đăng nhập bằng vân tay',
          'Bạn có muốn bật đăng nhập bằng vân tay để đăng nhập nhanh hơn không?',
          [
            {
              text: 'Không',
              style: 'cancel',
            },
            {
              text: 'Bật',
              onPress: async () => {
                const enabled = await biometricService.enableBiometric(email, password);
                if (enabled) {
                  setBiometricEnabled(true);
                  Alert.alert('Thành công', 'Đã bật đăng nhập bằng vân tay');
                } else {
                  Alert.alert('Lỗi', 'Không thể bật đăng nhập bằng vân tay');
                }
              },
            },
          ]
        );
      }
      
      route.push('../(tabs)/home');
    } catch (error) {
      Alert.alert('Lỗi', 'Đăng nhập thất bại, vui lòng thử lại sau.');
    } finally{
      setLoading(false)
    }
  };


  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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
                secureTextEntry={!showPassword}
                selectionColor={COLORS.primary}
                value={password}
                onChangeText={setPassword} />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={{ padding: 8 }}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={showPassword ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color={COLORS.grey} 
              />
            </TouchableOpacity>
        </View>
        <View style={styles.linkContainer}>
            <Link href="/forgotPassword" style={styles.linkText}>
                Quên mật khẩu?
            </Link>
            <Link href="/register" style={styles.linkText}>
                Bạn chưa có tài khoản?
            </Link>
        </View >
        {/* Container chứa nút đăng nhập và nút vân tay */}
        {biometricSupported ? (
          <View style={{ flexDirection: 'row', width: '85%', alignSelf: 'center', marginTop: 24, gap: 12 }}>
            {/* Nút đăng nhập - chiếm 90% khi có nút vân tay */}
            <TouchableOpacity 
              style={[styles.loginButton, { flex: 0.9, marginTop: 0 }]} 
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

            {/* Nút đăng nhập bằng vân tay - chiếm 10%, chỉ hiển thị icon */}
            <TouchableOpacity
              style={{ 
                flex: 0.1,
                marginTop: 0,
                backgroundColor: 'transparent', 
                borderWidth: 1, 
                borderColor: COLORS.primary,
                borderRadius: 12,
                paddingVertical: 16,
                paddingHorizontal: 0,
                minWidth: 50,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: 'transparent',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0,
                shadowRadius: 0,
                elevation: 0,
              }}
              onPress={async () => {
                if (biometricEnabled) {
                  await handleBiometricLogin();
                } else {
                  Alert.alert(
                    'Bật đăng nhập bằng vân tay',
                    'Bạn cần đăng nhập bằng email và mật khẩu trước để bật tính năng đăng nhập bằng vân tay.',
                    [{ text: 'Đã hiểu', style: 'default' }]
                  );
                }
              }}
              activeOpacity={0.8}
              disabled={biometricLoading || loading}
            >
              {biometricLoading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Ionicons 
                  name={biometricEnabled ? "finger-print" : "finger-print-outline"} 
                  size={24} 
                  color={COLORS.primary}
                />
              )}
            </TouchableOpacity>
          </View>
        ) : (
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
        )}

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
      </ScrollView>
    </KeyboardAvoidingView>
  )
}