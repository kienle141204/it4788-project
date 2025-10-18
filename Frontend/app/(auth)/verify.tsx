import OTPTextView from 'react-native-otp-textinput';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
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
    const data = {
      email: email,
      otp_code: otp
    }
    setLoadingValidate(true)
    try {
      const res = await OTPValidate(data)
      // if(res?.statusCode !=='200'){
      //   Alert.alert(res.message)
      // }
      const access = res.access_token
      const refresh = res.refresh_token

      await AsyncStorage.setItem('access_key', access as any)
      await AsyncStorage.setItem('refresh_key', refresh as any)
      const key = await AsyncStorage.getAllKeys()
      console.log(key)
      route.replace('../(home)');

    } catch (e) {
      throw e
    } finally {
      setLoadingValidate(false)
    }
  };

  const handleResend = async () => {
    setLoading(true)
    try {
      await resendEmail({ email: email })
      console.log('Gửi lại OTP');
    } catch (e) {
      throw e
    } finally {
      setLoading(false)
      setCounter(60);
      setCanResend(false);
    }

  };

  return (
    <View style={styles.container}>
      <View style={styles.otpSection}>
        <Text style={styles.appName}>Nhập mã OTP</Text>

        <Text style={{ color: COLORS.primary, marginTop: 10 }}>
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
              loading ? (<ActivityIndicator size="small" color="#fff" />) :
                (
                  <Text style={styles.resendButton}>
                    {canResend ? 'Gửi lại' : `Gửi lại (${counter}s)`}
                  </Text>
                )
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.touchValidate} onPress={handleSendOTP}>
            {loadingValidate ? (<ActivityIndicator size="small" color="#fff" />) : (
              <Text style={styles.otpButton}>Xác thực</Text>)}
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}
