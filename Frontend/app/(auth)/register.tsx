import { View, Text, ActivityIndicator } from 'react-native'
import React from 'react'
import { styles } from '@/styles/auth.styles'
import { TextInput, TouchableOpacity, Alert } from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { COLORS } from '@/constants/themes'
import { registerUser } from '@/service/auth'
import { Ionicons } from '@expo/vector-icons'

export default function register() {
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('');
  const [repassword, setRePassword] = useState('');
  const [loading, setLoading] = useState(false)
  const route = useRouter()

  const handleRegister = async () => {
    // Validation
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ email và mật khẩu!');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Lỗi', 'Email không đúng định dạng!');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }

    // Validate password match
    if (password !== repassword) {
      Alert.alert('Lỗi', 'Mật khẩu không khớp');
      return;
    }

    // Validate phone number format if provided
    if (phone && phone.trim() !== '') {
      const phoneRegex = /^[0-9+\-\s()]+$/;
      if (!phoneRegex.test(phone)) {
        Alert.alert('Lỗi', 'Số điện thoại không hợp lệ!');
        return;
      }
    }

    setLoading(true);
    try {
      const data = { email, phone_number: phone, password };
      const res = await registerUser(data);
  
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

        Alert.alert('Lỗi', message || 'Đăng ký thất bại');
        return;
      }

      // Success - navigate to verify page
      route.push({
        pathname: '/verify',
        params: { email },  
      });
    } catch (error) {
      Alert.alert('Lỗi', 'Đăng ký thất bại, vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.brandSection}>
        <View>
              <Text style={styles.appNameRegister}>Đăng ký tài khoản </Text>
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
            <Text style={styles.labelText}>Số điện thoại</Text>
        </View>
        <View style={[styles.inputWrapper, focusedInput === 'phone' && styles.inputFocused]}>
            <Ionicons name="call-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
            <TextInput        
                style={styles.inputInner}
                onFocus={() => setFocusedInput('phone')}
                onBlur={() => setFocusedInput(null)} 
                placeholder='Nhập số điện thoại của bạn' 
                placeholderTextColor={COLORS.grey}
                selectionColor={COLORS.primary}
                value={phone}
                keyboardType='phone-pad'
                onChangeText={setPhone} />
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
        <View style={styles.label}>
            <Text style={styles.labelText}>Nhập lại mật khẩu</Text>
        </View>
        <View style={[styles.inputWrapper, focusedInput === 'repassword' && styles.inputFocused]}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
            <TextInput        
                style={styles.inputInner}
                onFocus={() => setFocusedInput('repassword')}
                onBlur={() => setFocusedInput(null)} 
                placeholder='Nhập lại mật khẩu của bạn' 
                placeholderTextColor={COLORS.grey}
                secureTextEntry
                selectionColor={COLORS.primary}
                value={repassword}
                onChangeText={setRePassword} />
        </View>
        <View style={styles.loginButton}>
          <TouchableOpacity
            style={styles.touchAble}
            onPress={handleRegister}
            disabled={loading} // disable khi đang loading
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.loginButtonText}>Đăng ký</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}