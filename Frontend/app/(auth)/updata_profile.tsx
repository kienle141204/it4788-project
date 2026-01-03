import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  TextInput, 
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/themes";
import { styles } from "@/styles/auth.styles";
import { useRouter } from "expo-router";
import { uploadFileAccess, postAccess } from "@/utils/api";

export default function ProfileScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [fullname, setFullname] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const route = useRouter();

  // mở camera
  const openCamera = async () => {
    setModalVisible(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Lỗi", "Cần quyền truy cập camera để chụp ảnh.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    }) as ImagePicker.ImagePickerResult;
    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0].uri);
    }
  };

  // mở thư viện
  const openGallery = async () => {
    setModalVisible(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Lỗi", "Cần quyền truy cập thư viện ảnh để chọn ảnh.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]){
      await uploadImage(result.assets[0].uri);
    }
  };

  const removePhoto = () => {
    setModalVisible(false);
    setImage(null);
    setAvatarUrl('');
  };

  const uploadImage = async (imageUri: string) => {
    setUploadingImage(true);
    try {
      // Keep URI as-is for React Native
      const normalizedUri = imageUri;
      
      // Extract file extension from URI
      const uriParts = normalizedUri.split('.');
      let fileType = uriParts[uriParts.length - 1]?.toLowerCase() || 'jpg';
      
      // Remove query parameters if present
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
      formData.append('file', {
        uri: normalizedUri,
        name: `avatar.${fileType}`,
        type: mimeType,
      } as any);

      const response = await uploadFileAccess(formData, 'avatars');
      
      if (response && response.success && response.data) {
        const imageUrl = response.data.url || response.data.secure_url || response.data;
        setAvatarUrl(imageUrl);
        setImage(imageUri); // Keep local URI for display
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
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Lỗi', errorMessage);
      setImage(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSkip = () => {
    route.push('/(tabs)/home');
  };

  const handleUpdate = async () => {
    // Validation
    if (!fullname.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập họ tên (bắt buộc).");
      return;
    }

    if (fullname.trim().length < 2) {
      Alert.alert("Lỗi", "Họ tên phải có ít nhất 2 ký tự.");
      return;
    }

    setLoading(true);
    try {
      // Call register-user-info API with fullname, avatar_url, address
      await postAccess('auth/register-user-info', {
        fullname: fullname.trim(),
        avatar_url: avatarUrl.trim() || undefined,
        address: address.trim() || undefined,
      });

      Alert.alert("Thành công", "Cập nhật thông tin thành công!", [
        {
          text: "OK",
          onPress: () => route.push('/(tabs)/home')
        }
      ]);
    } catch (error: any) {
      let errorMessage = 'Không thể cập nhật thông tin. Vui lòng thử lại.';
      const errorData = error?.response?.data;
      
      if (error.response?.status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      } else if (error.response?.status === 400) {
        errorMessage = errorData?.message || 'Dữ liệu không hợp lệ.';
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      Alert.alert("Lỗi", errorMessage);
    } finally {
      setLoading(false);
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
       <Text style={styles.header}>Cập nhật thông tin</Text>

      <View style={styles.avatarContainer}>
        <Image
          source={
            image
              ? { uri: image }
              : avatarUrl
              ? { uri: avatarUrl }
              : require("@/assets/images/avatar.png")
          }
          style={styles.avatar}
        />
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={() => setModalVisible(true)}
          disabled={uploadingImage}
        >
          {uploadingImage ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <MaterialIcons name="photo-camera" size={40} color={COLORS.white} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.label}>
        <Text style={styles.labelText}>Họ tên <Text style={{color: COLORS.orange}}>*</Text></Text>
      </View>

      <View style={[styles.inputWrapper, focusedInput === 'fullname' && styles.inputFocused]}>
        <Ionicons name="person-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
        <TextInput        
          style={styles.inputInner}
          onFocus={() => setFocusedInput('fullname')}
          onBlur={() => setFocusedInput(null)} 
          placeholder='Nhập họ tên của bạn' 
          placeholderTextColor={COLORS.grey}
          selectionColor={COLORS.primary}
          value={fullname}
          onChangeText={setFullname} />
      </View>

      <View style={styles.label}>
        <Text style={styles.labelText}>Địa chỉ</Text>
      </View>
        <View style={[styles.inputWrapper, focusedInput === 'address' && styles.inputFocused]}>
            <Ionicons name="location-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
            <TextInput        
                style={styles.inputInner}
                onFocus={() => setFocusedInput('address')}
                onBlur={() => setFocusedInput(null)} 
                placeholder='Nhập địa chỉ của bạn' 
                placeholderTextColor={COLORS.grey}
                selectionColor={COLORS.primary}
                value={address}
                onChangeText={setAddress} />
      </View>

        <View style={styles.otpViewTouch}>
          <TouchableOpacity style={ styles.skip} onPress={handleSkip}>
            <Text style={styles.skipText}>
              Bỏ qua {'>>'}
            </Text>
      
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.touchValidate} 
            onPress={handleUpdate}
            disabled={loading || uploadingImage}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.otpButton}>Cập nhật</Text>
            )}
          </TouchableOpacity>
        </View>

      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
       <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
         <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Profile Photo</Text>

            <View style={styles.modalOptions}>
              <TouchableOpacity style={styles.option} onPress={openCamera}>
                <MaterialIcons name="photo-camera" size={28} color={COLORS.orange} />
                <Text style={styles.optionText}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.option} onPress={openGallery}>
                <MaterialIcons name="photo-library" size={28} color={COLORS.orange} />
                <Text style={styles.optionText}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.option} onPress={removePhoto}>
                <MaterialIcons name="delete" size={28} color={COLORS.orange} />
                <Text style={styles.optionText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
       </TouchableWithoutFeedback>
      </Modal>
     </View>
    </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


