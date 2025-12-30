import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/themes';
import { createRefrigerator } from '@/service/fridge';
import { getMyFamilies, type Family } from '@/service/family';
import { getAccess } from '@/utils/api';

export default function CreateFridgePage() {
  const router = useRouter();
  const sessionExpiredRef = useRef(false);
  const [refrigeratorType, setRefrigeratorType] = useState<'personal' | 'family'>('personal');
  const [selectedFamilyId, setSelectedFamilyId] = useState<number | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFamilies, setLoadingFamilies] = useState(true);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
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

  const fetchUserProfile = useCallback(async () => {
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
      console.error('Error fetching user profile:', err);
    }
  }, [handleSessionExpired]);

  const fetchFamilies = useCallback(async () => {
    if (!userProfile?.id) {
      // Wait for user profile to be loaded
      return;
    }
    
    setLoadingFamilies(true);
    try {
      const familiesData = await getMyFamilies();
      
      // Filter to only show families where user is the owner
      // Only owners can create refrigerators for families
      const userOwnedFamilies = familiesData.filter((family: Family) => {
        // User must be the owner to create refrigerator for family
        const ownerId = typeof family.owner_id === 'string' 
          ? parseInt(family.owner_id, 10) 
          : Number(family.owner_id);
        const userId = typeof userProfile.id === 'string'
          ? parseInt(userProfile.id, 10)
          : Number(userProfile.id);
        
        return ownerId === userId;
      });
      
      setFamilies(userOwnedFamilies);
    } catch (err: any) {
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        handleSessionExpired();
        return;
      }
      console.error('Error fetching families:', err);
    } finally {
      setLoadingFamilies(false);
    }
  }, [handleSessionExpired, userProfile]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  useEffect(() => {
    if (userProfile?.id) {
      fetchFamilies();
    }
  }, [userProfile, fetchFamilies]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(fridge)' as any);
    }
  };

  const handleTypeChange = (type: 'personal' | 'family') => {
    setRefrigeratorType(type);
    if (type === 'personal') {
      setSelectedFamilyId(null);
    }
  };

  const handleSelectFamily = (family: Family) => {
    setSelectedFamilyId(family.id);
    setShowFamilyModal(false);
  };

  const handleCreate = async () => {
    if (refrigeratorType === 'family' && !selectedFamilyId) {
      Alert.alert('Lỗi', 'Vui lòng chọn gia đình');
      return;
    }

    setLoading(true);
    try {
      // Backend will automatically set owner_id from JWT token
      // No need to send owner_id in the request
      const data: any = {};

      if (refrigeratorType === 'family' && selectedFamilyId) {
        // Ensure family_id is a number
        const familyId = typeof selectedFamilyId === 'string'
          ? parseInt(selectedFamilyId, 10)
          : Number(selectedFamilyId);
        
        if (isNaN(familyId)) {
          Alert.alert('Lỗi', 'ID gia đình không hợp lệ');
          setLoading(false);
          return;
        }
        
        data.family_id = familyId;
      }

      console.log('[Create Fridge] Request data:', JSON.stringify(data, null, 2));
      await createRefrigerator(data);

      Alert.alert('Thành công', 'Đã tạo tủ lạnh thành công!', [
        {
          text: 'OK',
          onPress: () => {
            router.replace('/(fridge)' as any);
          },
        },
      ]);
    } catch (err: any) {
      console.error('Error creating refrigerator:', err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể tạo tủ lạnh. Vui lòng thử lại.';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const selectedFamily = families.find(f => f.id === selectedFamilyId);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background || COLORS.white }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 16,
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
          Tạo tủ lạnh mới
        </Text>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Type Selection */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: COLORS.darkGrey,
              marginBottom: 12,
            }}
          >
            Loại tủ lạnh
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                padding: 16,
                borderRadius: 12,
                backgroundColor:
                  refrigeratorType === 'personal' ? COLORS.greenLight : COLORS.white,
                borderWidth: 2,
                borderColor:
                  refrigeratorType === 'personal' ? COLORS.primary : '#E5E5E5',
                alignItems: 'center',
              }}
              onPress={() => handleTypeChange('personal')}
            >
              <Ionicons
                name="person"
                size={24}
                color={refrigeratorType === 'personal' ? COLORS.primary : COLORS.grey}
              />
              <Text
                style={{
                  marginTop: 8,
                  fontSize: 14,
                  fontWeight: '600',
                  color:
                    refrigeratorType === 'personal' ? COLORS.primary : COLORS.grey,
                }}
              >
                Cá nhân
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                padding: 16,
                borderRadius: 12,
                backgroundColor:
                  refrigeratorType === 'family' ? COLORS.greenLight : COLORS.white,
                borderWidth: 2,
                borderColor:
                  refrigeratorType === 'family' ? COLORS.primary : '#E5E5E5',
                alignItems: 'center',
              }}
              onPress={() => handleTypeChange('family')}
            >
              <Ionicons
                name="people"
                size={24}
                color={refrigeratorType === 'family' ? COLORS.primary : COLORS.grey}
              />
              <Text
                style={{
                  marginTop: 8,
                  fontSize: 14,
                  fontWeight: '600',
                  color:
                    refrigeratorType === 'family' ? COLORS.primary : COLORS.grey,
                }}
              >
                Gia đình
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Family Selection (if family type) */}
        {refrigeratorType === 'family' && (
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: COLORS.darkGrey,
                marginBottom: 8,
              }}
            >
              Chọn gia đình
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: COLORS.white,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: COLORS.background || '#E5E5E5',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
              onPress={() => setShowFamilyModal(true)}
            >
              <Text
                style={{
                  fontSize: 16,
                  color: selectedFamily ? COLORS.darkGrey : COLORS.grey,
                }}
              >
                {selectedFamily ? selectedFamily.name : 'Chọn gia đình'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.grey} />
            </TouchableOpacity>
          </View>
        )}

        {/* Create Button */}
        <TouchableOpacity
          style={{
            backgroundColor: COLORS.primary,
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
              Tạo tủ lạnh
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Family Selection Modal */}
      <Modal
        visible={showFamilyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFamilyModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: COLORS.white,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: '70%',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 20,
                borderBottomWidth: 1,
                borderBottomColor: COLORS.background || '#F5F5F5',
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: COLORS.darkGrey,
                }}
              >
                Chọn gia đình
              </Text>
              <TouchableOpacity onPress={() => setShowFamilyModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.darkGrey} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              {loadingFamilies ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
              ) : families.length === 0 ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Ionicons name="people-outline" size={48} color={COLORS.grey} />
                  <Text style={{ color: COLORS.grey, marginTop: 12, textAlign: 'center' }}>
                    Bạn chưa là chủ hộ của gia đình nào
                  </Text>
                  <Text style={{ color: COLORS.grey, marginTop: 8, fontSize: 12, textAlign: 'center' }}>
                    Chỉ chủ hộ mới có thể tạo tủ lạnh cho gia đình
                  </Text>
                </View>
              ) : (
                families.map(family => (
                  <TouchableOpacity
                    key={family.id}
                    onPress={() => handleSelectFamily(family)}
                    style={{
                      padding: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: '#F0F0F0',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 16, color: COLORS.darkGrey }}>
                      {family.name}
                    </Text>
                    {selectedFamilyId === family.id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={COLORS.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

