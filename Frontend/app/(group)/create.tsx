import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/themes';
import { createFamily } from '@/service/family';
import { getAccess } from '@/utils/api';

export default function CreateFamilyPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const sessionExpiredRef = useRef(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  const handleSessionExpired = useCallback(() => {
    if (sessionExpiredRef.current) {
      return;
    }
    sessionExpiredRef.current = true;
    Alert.alert('Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại.', [
      {
        text: 'OK',
        onPress: () => router.replace('/(auth)' as any),
      },
    ]);
  }, [router]);

  React.useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await getAccess('auth/profile');
        // API response có cấu trúc: { success, message, data: { ...userInfo } }
        const profile = response?.data || response;
        setUserProfile(profile);
      } catch (err: any) {
        if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
          handleSessionExpired();
          return;
        }
      }
    };
    fetchUserProfile();
  }, [handleSessionExpired]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(group)' as any);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên gia đình');
      return;
    }

    if (!userProfile?.id) {
      Alert.alert('Lỗi', 'Không thể lấy thông tin người dùng');
      return;
    }

    setLoading(true);
    try {
      // Ensure owner_id is a number
      const ownerId = typeof userProfile.id === 'string' 
        ? parseInt(userProfile.id, 10) 
        : Number(userProfile.id);
      
      if (isNaN(ownerId)) {
        Alert.alert('Lỗi', 'ID người dùng không hợp lệ');
        setLoading(false);
        return;
      }

      const data: any = {
        name: name.trim(),
        owner_id: ownerId,
      };

      await createFamily(data);

      Alert.alert('Thành công', 'Đã tạo gia đình thành công!', [
        {
          text: 'OK',
          onPress: () => {
            router.replace('/(group)' as any);
          },
        },
      ]);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể tạo gia đình. Vui lòng thử lại.';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background || COLORS.white }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: Math.max(insets.top, 16) + 10,
          paddingBottom: 16,
          backgroundColor: COLORS.white,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.background || '#F5F5F5',
        }}
      >
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.darkGrey} />
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: COLORS.darkGrey,
          }}
        >
          Tạo gia đình mới
        </Text>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Name Input */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: COLORS.darkGrey,
              marginBottom: 8,
            }}
          >
            Tên gia đình <Text style={{ color: COLORS.red || '#EF4444' }}>*</Text>
          </Text>
          <TextInput
            style={{
              backgroundColor: COLORS.white,
              borderRadius: 12,
              padding: 16,
              fontSize: 16,
              borderWidth: 1,
              borderColor: COLORS.background || '#E5E5E5',
            }}
            placeholder="Nhập tên gia đình"
            value={name}
            onChangeText={setName}
            placeholderTextColor={COLORS.grey}
          />
        </View>

        {/* Info Text */}
        <View
          style={{
            backgroundColor: '#E0F2FE',
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Ionicons name="information-circle" size={20} color="#0EA5E9" style={{ marginRight: 8, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: '#0EA5E9', fontWeight: '600', marginBottom: 4 }}>
                Thông tin
              </Text>
              <Text style={{ fontSize: 13, color: '#0369A1', lineHeight: 18 }}>
                Bạn sẽ trở thành chủ hộ của gia đình này. Sau khi tạo, bạn có thể mời các thành viên khác tham gia bằng mã mời.
              </Text>
            </View>
          </View>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={{
            backgroundColor: COLORS.purple || '#A855F7',
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
            marginTop: 8,
          }}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: COLORS.white,
              }}
            >
              Tạo gia đình
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

