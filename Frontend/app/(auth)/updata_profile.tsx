import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  TextInput, Alert
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/themes";
import { styles } from "@/styles/auth.styles";

export default function ProfileScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
  

  // mở camera
  const openCamera = async () => {
    setModalVisible(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return alert("Camera permission denied");
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    }) as ImagePicker.ImagePickerResult;
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // mở thư viện
  const openGallery = async () => {
    setModalVisible(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return alert("Gallery permission denied");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled){
      setImage(result.assets[0].uri);
    }
  };


  const removePhoto = () => {
    setModalVisible(false);
    setImage(null);
  };

    const handleSkip = () => {
    Alert.alert("Bỏ qua", "Bạn đã bỏ qua cập nhật thông tin!");
    setPhone("");
    setAddress("");
    setImage(null);
  };

  const handleUpdate = async () => {
    if (!phone || !address) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập đầy đủ số điện thoại và địa chỉ.");
      return;
    }

    const formData = new FormData();
    formData.append("phone", phone);
    formData.append("address", address);

    if (image) {
      const uriParts = image.split(".");
      const fileType = uriParts[uriParts.length - 1];
      formData.append("file", {
        uri: image,
        name: `avatar.${fileType}`,
        type: `image/${fileType}`,
      } as any);
    }

    try {
      // const res = await fetch("https://your-nestjs-api.com/upload", {
      //   method: "POST",
      //   body: formData,
      //   headers: { "Content-Type": "multipart/form-data" },
      // });
      // const data = await res.json();
      Alert.alert("Thành công", "Cập nhật thông tin thành công!");
    } catch (err) {
      Alert.alert("Lỗi", "Không thể cập nhật thông tin!");
    }
  };

  return (
    <View style={styles.container}>
     <View  style ={styles.brandSection}>
       <Text style={styles.header}>Cập nhật thông tin</Text>

      <View style={styles.avatarContainer}>
        <Image
          source={
            image
              ? { uri: image }
              : require("@/assets/images/avatar.png")
          }
          style={styles.avatar}
        />
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={() => setModalVisible(true)}
        >
          <MaterialIcons name="photo-camera" size={40} color={COLORS.white} />
        </TouchableOpacity>
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

          <TouchableOpacity style={styles.touchValidate} onPress={handleUpdate} >
            
              <Text style={styles.otpButton}>Cập nhật</Text>
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
  );
}


