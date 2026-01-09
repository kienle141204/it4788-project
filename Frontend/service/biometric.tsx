import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_EMAIL_KEY = 'biometric_email';
const BIOMETRIC_PASSWORD_KEY = 'biometric_password';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

class BiometricService {
  /**
   * Kiểm tra thiết bị có hỗ trợ xác thực sinh trắc học không
   */
  async isSupported(): Promise<boolean> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      return compatible;
    } catch (error) {
      console.error('[Biometric] Error checking hardware support:', error);
      return false;
    }
  }

  /**
   * Kiểm tra có phương thức xác thực sinh trắc học nào đã được đăng ký không
   */
  async isEnrolled(): Promise<boolean> {
    try {
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return enrolled;
    } catch (error) {
      console.error('[Biometric] Error checking enrollment:', error);
      return false;
    }
  }

  /**
   * Lấy danh sách các phương thức xác thực sinh trắc học có sẵn
   */
  async getSupportedAuthenticationTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      return types;
    } catch (error) {
      console.error('[Biometric] Error getting supported types:', error);
      return [];
    }
  }

  /**
   * Kiểm tra xem đăng nhập bằng vân tay đã được bật chưa
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('[Biometric] Error checking if enabled:', error);
      return false;
    }
  }

  /**
   * Bật đăng nhập bằng vân tay và lưu thông tin đăng nhập
   */
  async enableBiometric(email: string, password: string): Promise<boolean> {
    try {
      // Kiểm tra thiết bị hỗ trợ
      const supported = await this.isSupported();
      if (!supported) {
        console.warn('[Biometric] Device does not support biometric authentication');
        return false;
      }

      // Kiểm tra đã đăng ký phương thức sinh trắc học
      const enrolled = await this.isEnrolled();
      if (!enrolled) {
        console.warn('[Biometric] No biometric authentication method enrolled');
        return false;
      }

      // Lưu email và password vào SecureStore
      await SecureStore.setItemAsync(BIOMETRIC_EMAIL_KEY, email);
      await SecureStore.setItemAsync(BIOMETRIC_PASSWORD_KEY, password);

      // Đánh dấu đã bật
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');

      console.log('[Biometric] Biometric login enabled successfully');
      return true;
    } catch (error) {
      console.error('[Biometric] Error enabling biometric:', error);
      return false;
    }
  }

  /**
   * Tắt đăng nhập bằng vân tay và xóa thông tin đăng nhập
   */
  async disableBiometric(): Promise<void> {
    try {
      await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_EMAIL_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_PASSWORD_KEY);
      console.log('[Biometric] Biometric login disabled');
    } catch (error) {
      console.error('[Biometric] Error disabling biometric:', error);
    }
  }

  /**
   * Lấy email đã lưu (nếu có)
   */
  async getSavedEmail(): Promise<string | null> {
    try {
      const email = await SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY);
      return email;
    } catch (error) {
      console.error('[Biometric] Error getting saved email:', error);
      return null;
    }
  }

  /**
   * Lấy password đã lưu (nếu có)
   */
  async getSavedPassword(): Promise<string | null> {
    try {
      const password = await SecureStore.getItemAsync(BIOMETRIC_PASSWORD_KEY);
      return password;
    } catch (error) {
      console.error('[Biometric] Error getting saved password:', error);
      return null;
    }
  }

  /**
   * Xác thực bằng vân tay/sinh trắc học
   */
  async authenticate(reason?: string): Promise<BiometricAuthResult> {
    try {
      // Kiểm tra thiết bị hỗ trợ
      const supported = await this.isSupported();
      if (!supported) {
        return {
          success: false,
          error: 'Thiết bị không hỗ trợ xác thực sinh trắc học',
        };
      }

      // Kiểm tra đã đăng ký
      const enrolled = await this.isEnrolled();
      if (!enrolled) {
        return {
          success: false,
          error: 'Chưa đăng ký phương thức xác thực sinh trắc học',
        };
      }

      // Xác định lý do xác thực
      const promptMessage = reason || 'Xác thực để đăng nhập';

      // Thực hiện xác thực
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Hủy',
        disableDeviceFallback: false, // Cho phép dùng mật khẩu thiết bị nếu xác thực sinh trắc học thất bại
        fallbackLabel: 'Sử dụng mật khẩu thiết bị',
      });

      if (result.success) {
        return { success: true };
      } else {
        let errorMessage = 'Xác thực thất bại';
        
        if (result.error === 'user_cancel') {
          errorMessage = 'Người dùng đã hủy xác thực';
        } else if (result.error === 'user_fallback') {
          errorMessage = 'Người dùng chọn dùng mật khẩu thiết bị';
        } else if (result.error === 'system_cancel') {
          errorMessage = 'Hệ thống đã hủy xác thực';
        } else if (result.error === 'passcode_not_set') {
          errorMessage = 'Chưa thiết lập mật khẩu thiết bị';
        } else if (result.error === 'not_available') {
          errorMessage = 'Xác thực sinh trắc học không khả dụng';
        } else if (result.error === 'not_enrolled') {
          errorMessage = 'Chưa đăng ký phương thức xác thực sinh trắc học';
        }

        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch (error: any) {
      console.error('[Biometric] Error during authentication:', error);
      return {
        success: false,
        error: error?.message || 'Lỗi xác thực không xác định',
      };
    }
  }

  /**
   * Kiểm tra xem có thể sử dụng đăng nhập bằng vân tay không
   * (thiết bị hỗ trợ, đã đăng ký, và đã bật tính năng)
   */
  async canUseBiometricLogin(): Promise<boolean> {
    try {
      const supported = await this.isSupported();
      const enrolled = await this.isEnrolled();
      const enabled = await this.isBiometricEnabled();

      return supported && enrolled && enabled;
    } catch (error) {
      console.error('[Biometric] Error checking if can use biometric:', error);
      return false;
    }
  }

  /**
   * Lấy tên phương thức xác thực sinh trắc học (để hiển thị cho người dùng)
   */
  getBiometricTypeName(): string {
    if (Platform.OS === 'ios') {
      return 'Face ID hoặc Touch ID';
    } else {
      return 'Vân tay';
    }
  }
}

// Export singleton instance
export const biometricService = new BiometricService();

