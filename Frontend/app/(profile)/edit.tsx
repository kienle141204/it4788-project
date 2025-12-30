import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { COLORS } from '@/constants/themes';
import { getAccess, postAccess, uploadFileAccess } from '@/utils/api';

export default function EditProfileScreen() {
  const router = useRouter();
  const [fullname, setfullname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  // Lấy sẵn thông tin hiện tại để prefill form
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getAccess('auth/profile');
        // API response có cấu trúc: { success, message, data: { ...userInfo } }
        const profile = response?.data || response;
        if (profile) {
          setfullname(profile.full_name || profile.fullname || '');
          setAvatarUrl(profile.avatar_url || '');
          setAddress(profile.address || '');
        }
      } catch (error) {
      }
    };

    fetchProfile();
  }, []);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập', 'Cần quyền truy cập thư viện ảnh để chọn ảnh đại diện.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImageUri(imageUri);
        await uploadImage(imageUri);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập', 'Cần quyền truy cập camera để chụp ảnh.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImageUri(imageUri);
        await uploadImage(imageUri);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Chọn ảnh đại diện',
      'Bạn muốn chọn ảnh từ đâu?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Thư viện ảnh', onPress: pickImage },
        { text: 'Chụp ảnh', onPress: takePhoto },
      ],
      { cancelable: true }
    );
  };

  const uploadImage = async (imageUri: string) => {
    setUploadingImage(true);
    try {
      
      // Keep URI as-is for React Native (expo-image-picker returns correct format)
      // Don't modify file:// or content:// URIs
      const normalizedUri = imageUri;
      
      // Extract file extension from URI
      // Handle both file:// and content:// URIs
      const uriParts = normalizedUri.split('.');
      let fileType = uriParts[uriParts.length - 1]?.toLowerCase() || 'jpg';
      
      // Remove query parameters if present (e.g., content://...?id=123)
      if (fileType.includes('?')) {
        fileType = fileType.split('?')[0];
      }
      
      // Default to jpeg if extension is unclear
      if (!fileType || !['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType)) {
        fileType = 'jpg';
      }
      
      // Determine correct MIME type
      let mimeType = 'image/jpeg'; // default
      if (fileType === 'jpg' || fileType === 'jpeg') {
        mimeType = 'image/jpeg';
      } else if (fileType === 'png') {
        mimeType = 'image/png';
      } else if (fileType === 'gif') {
        mimeType = 'image/gif';
      } else if (fileType === 'webp') {
        mimeType = 'image/webp';
      }
      
      
      // Create FormData with proper React Native file object structure
      const formData = new FormData();
      
      // React Native FormData requires this specific structure
      formData.append('file', {
        uri: normalizedUri,
        name: `avatar.${fileType}`,
        type: mimeType,
      } as any);

      const response = await uploadFileAccess(formData, 'avatars');
      
      if (response && response.success && response.data) {
        const imageUrl = response.data.url || response.data.secure_url || response.data;
        setAvatarUrl(imageUrl);
      } else {
        throw new Error(response?.message || 'Upload failed');
      }
    } catch (error: any) {
      let errorMessage = 'Không thể upload ảnh. Vui lòng thử lại.';
      const errorData = error?.response?.data;
      
      // Handle network errors
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = 'Upload quá lâu. Vui lòng kiểm tra kết nối mạng và thử lại.';
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error') || error.message?.includes('Network request failed')) {
        errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra:\n- Kết nối internet\n- Backend server đang chạy\n- Địa chỉ API đúng';
      } else if (error.response?.status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      } else if (error.response?.status === 400) {
        errorMessage = errorData?.message || 'File không hợp lệ hoặc quá lớn (tối đa 10MB).';
      } else if (errorData?.message) {
        errorMessage = errorData.message;
        // If it's a Cloudinary config error, show a more user-friendly message
        if (errorData.message.includes('api_key')) {
          errorMessage = 'Lỗi cấu hình server. Vui lòng liên hệ quản trị viên.';
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Lỗi', errorMessage);
      setSelectedImageUri(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!fullname.trim() || !address.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ họ tên và địa chỉ.');
      return;
    }

    setLoading(true);
    try {
      await postAccess('auth/register-user-info', {
        fullname: fullname.trim() || undefined,
        avatar_url: avatarUrl.trim() || undefined,
        address: address.trim() || undefined,
      });

      Alert.alert('Thành công', 'Cập nhật thông tin cá nhân thành công.');
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/home' as any);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật thông tin. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/home' as any);
            }
          }}>
            <Ionicons name="arrow-back" size={22} color={COLORS.darkGrey} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sửa thông tin cá nhân</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>

            <View style={styles.inputRow}>
              <View style={styles.iconWrapper}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={COLORS.primary || COLORS.purple}
                />
              </View>
              <View style={styles.inputTextWrapper}>
                <Text style={styles.inputLabel}>Họ và tên</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập họ và tên"
                  placeholderTextColor={COLORS.grey}
                  selectionColor={COLORS.primary}
                  value={fullname}
                  onChangeText={setfullname}
                />
              </View>
            </View>

            <View style={styles.avatarSection}>
              <Text style={styles.inputLabel}>Ảnh đại diện</Text>
              <View style={styles.avatarContainer}>
                <View style={styles.avatarWrapper}>
                  {(selectedImageUri || avatarUrl) ? (
                    <Image
                      source={{ uri: selectedImageUri || avatarUrl }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons
                        name="person-outline"
                        size={40}
                        color={COLORS.grey}
                      />
                    </View>
                  )}
                  {uploadingImage && (
                    <View style={styles.uploadingOverlay}>
                      <ActivityIndicator size="small" color={COLORS.white} />
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={showImagePickerOptions}
                  disabled={uploadingImage}
                >
                  <Ionicons
                    name="camera-outline"
                    size={18}
                    color={COLORS.primary || COLORS.purple}
                  />
                  <Text style={styles.uploadButtonText}>
                    {uploadingImage ? 'Đang upload...' : 'Chọn ảnh'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={styles.iconWrapper}>
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={COLORS.primary || COLORS.purple}
                />
              </View>
              <View style={styles.inputTextWrapper}>
                <Text style={styles.inputLabel}>Địa chỉ</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập địa chỉ của bạn"
                  placeholderTextColor={COLORS.grey}
                  selectionColor={COLORS.primary}
                  value={address}
                  onChangeText={setAddress}
                />
              </View>
            </View>
          </View>

          <View style={styles.footerButtons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(tabs)/home' as any);
                }
              }}
              disabled={loading}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background || '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.darkGrey,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGrey,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  inputTextWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: COLORS.grey,
    marginBottom: 2,
  },
  input: {
    fontSize: 15,
    color: COLORS.darkGrey,
    paddingVertical: 0,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
  },
  saveButton: {
    backgroundColor: COLORS.primary || COLORS.purple,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 15,
  },
  cancelButtonText: {
    color: COLORS.darkGrey,
  },
  avatarSection: {
    marginBottom: 20,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: COLORS.primary || COLORS.purple,
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: 14,
    color: COLORS.primary || COLORS.purple,
    fontWeight: '500',
  },
});

