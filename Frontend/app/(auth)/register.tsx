import { View, Text, ActivityIndicator } from 'react-native'
import React from 'react'
import { styles } from '@/styles/auth.styles'
import { TextInput, TouchableOpacity, Alert } from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { COLORS } from '@/constants/themes'
import { registerUser } from '@/service/auth'

export default function register() {
  const [isFocused, setIsFocused] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('');
  const [repassword, setRePassword] = useState('');
  const [loading, setLoading] = useState(false)
  const route = useRouter()

  const handleRegister = async () => {
    if (password !== repassword) {
      Alert.alert('Lỗi', 'Mật khẩu không khớp');
      return;
    }

    setLoading(true);
    try {
      const data = { email, phone_number: phone, password };
      const res = await registerUser(data);
      console.log(res);
  
      route.push({
        pathname: '/verify',
        params: { email },  
      });
    } catch (error) {
      console.log(error);
      Alert.alert('Lỗi', 'Đăng ký thất bại');
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
            keyboardType='email-address'
            onChangeText={setEmail}
            placeholderTextColor={COLORS.primary} />
        </View>
        <View style={styles.label}>
            <Text style={styles.labelText}> Số điện thoại</Text>
        </View>
        <View style={styles.inputContainer}>
            <TextInput        
            style={[styles.input, isFocused && styles.inputFocused]}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)} 
            placeholder='Nhập số điện thoại của bạn' 
            selectionColor={COLORS.primary}
            placeholderTextColor={COLORS.primary}
            value={phone}
            keyboardType='decimal-pad'
            onChangeText={setPhone} />
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
                <View style={styles.label}>
            <Text style={styles.labelText}> Nhập lại mật khẩu</Text>
        </View>
        <View style={styles.inputContainer}>
            <TextInput        
            style={[styles.input, isFocused && styles.inputFocused]}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)} 
            placeholder='Nhập lại mật khẩu của bạn' 
            secureTextEntry
            selectionColor={COLORS.primary}
            placeholderTextColor={COLORS.primary}
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
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Đăng ký</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}