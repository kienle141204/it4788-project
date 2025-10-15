import OTPTextView from 'react-native-otp-textinput';
import {View, Text, TouchableOpacity} from 'react-native'
import { styles } from '@/styles/auth.styles'; 
import { COLORS } from '@/constants/themes';
import { useState } from 'react';

export default function Verify() {

  const [otp, setOTP] = useState('')
  const handleSendOTP = () => {
    console.log(otp)
  }
  return (
    <View style={styles.container}>
        <View style={styles.otpSection}>
            <Text style={styles.appName}>Nhập mã OTP</Text>
            <OTPTextView
                inputCount={6}
                handleTextChange={(text) => setOTP(text)}
                // style={styles.otp}
                containerStyle={{ marginVertical: 20 }}
                textInputStyle={{
                borderRadius: 10,
                borderColor: COLORS.primary,
                 ...( { color: COLORS.primary } as any )
                }}
            />
            <View style={styles.loginButton}>
                <TouchableOpacity  onPress={handleSendOTP}>
                    <Text style={styles.loginButtonText}>Đăng nhập</Text>
                </TouchableOpacity>
            </View>
            
        </View>
            
    </View>
  );
}
