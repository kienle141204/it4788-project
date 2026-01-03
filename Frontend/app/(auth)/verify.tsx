import OTPTextView from 'react-native-otp-textinput';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { styles } from '@/styles/auth.styles';
import { COLORS } from '@/constants/themes';
import { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { OTPValidate, resendEmail } from '@/service/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function Verify() {
  const route = useRouter()
  const [otp, setOTP] = useState('');
  const [counter, setCounter] = useState(60); // countdown 60s
  const [canResend, setCanResend] = useState(false);
  const { email } = useLocalSearchParams();
  const [loading, setLoading] = useState(false)
  const [loadingValidate, setLoadingValidate] = useState(false)
  const emailStr = Array.isArray(email) ? email[0] : email;

  // Ẩn email (ví dụ em*****om)nsole.log('Gửi lại OTP');
  const maskEmail = (email: string) => {
    const [name, domain] = email.split('@');
    if (!name || !domain) return email;
    const first = name.slice(0, 2);
    return `${first}*****@${domain}`;
  };

  // Countdown cho nút gửi lại
  useEffect(() => {
    if (counter === 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCounter(counter - 1), 1000);
    return () => clearTimeout(timer);
  }, [counter]);

  const handleSendOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ mã OTP (6 số)');
      return;
    }

    setLoadingValidate(true)
    try {
      const data = {
        email: email,
        otp_code: otp
      }
      const res = await OTPValidate(data)
      
      // Check if response exists and has error
      if (!res) {
        Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ');
        return;
      }
      
      // Check for error status code
      if (res?.statusCode) {
        let message = res?.message;
        if (Array.isArray(message)) {
          message = message.join('\n');
        }
        Alert.alert('Lỗi', message || 'Xác thực OTP thất bại');
        return;
      }

      const access = res.access_token
      const refresh = res.refresh_token

      if (!access || !refresh) {
        Alert.alert('Lỗi', 'Không nhận được token từ server');
        return;
      }

      await AsyncStorage.setItem('access_token', access as any)
      await AsyncStorage.setItem('refresh_token', refresh as any)
      
      route.push('/(auth)/updata_profile')

    } catch (e: any) {
      let errorMessage = 'Xác thực OTP thất bại, vui lòng thử lại.';
      if (e?.response?.data?.message) {
        errorMessage = e.response.data.message;
      } else if (e?.message) {
        errorMessage = e.message;
      }
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoadingValidate(false)
    }
  };

  const handleResend = async () => {
    setLoading(true)
    try {
      const res = await resendEmail({ email: email })
      
      // Check if response exists and has error
      if (!res) {
        Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ');
        return;
      }
      
      // Check for error status code
      if (res?.statusCode) {
        let message = res?.message;
        if (Array.isArray(message)) {
          message = message.join('\n');
        }
        Alert.alert('Lỗi', message || 'Gửi lại OTP thất bại');
        return;
      }

      Alert.alert('Thành công', 'Đã gửi lại mã OTP. Vui lòng kiểm tra email.');
      setCounter(60);
      setCanResend(false);
    } catch (e: any) {
      let errorMessage = 'Gửi lại OTP thất bại, vui lòng thử lại.';
      if (e?.response?.data?.message) {
        errorMessage = e.response.data.message;
      } else if (e?.message) {
        errorMessage = e.message;
      }
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false)
    }

  };

  return (
    <View style={styles.container}>
      <View style={styles.otpSection}>
        <Text style={styles.appName}>Nhập mã OTP</Text>

        <Text style={styles.verifySubtext}>
          Chúng tôi đã gửi mã đến địa chỉ {maskEmail(email as string)}
        </Text>

        <OTPTextView
          inputCount={6}
          handleTextChange={(text) => setOTP(text)}
          containerStyle={{ marginVertical: 20 }}
          textInputStyle={{
            borderRadius: 10,
            borderColor: COLORS.primary,
            ... ({ color: COLORS.primary, } as any)
          }}
        />

        {/* Nút gửi lại và xác thực */}
        <View style={styles.otpViewTouch}>
          <TouchableOpacity
            onPress={handleResend}
            disabled={!canResend}
            style={canResend ? styles.touchResend : styles.touchNoResend}
          >
            {
              loading ? (<ActivityIndicator size="small" color={canResend ? COLORS.white : COLORS.grey} />) :
                (
                  <Text style={canResend ? styles.resendButton : styles.resendButtonDisabled}>
                    {canResend ? 'Gửi lại' : `Gửi lại (${counter}s)`}
                  </Text>
                )
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.touchValidate} onPress={handleSendOTP}>
            {loadingValidate ? (<ActivityIndicator size="small" color={COLORS.white} />) : (
              <Text style={styles.otpButton}>Xác thực</Text>)}
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}
