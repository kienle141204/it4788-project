import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { groupStyles } from '../../styles/group.styles';
import { COLORS } from '../../constants/themes';
import { getMyFamilies } from '../../service/family';

interface Family {
  id: number;
  name: string;
  memberCount: number;
  owner_id: number;
  created_at: string;
}

export default function GroupPage() {
  const router = useRouter();
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSessionExpired = useCallback(() => {
    Alert.alert(
      'Phiên đăng nhập hết hạn',
      'Vui lòng đăng nhập lại',
      [
        {
          text: 'OK',
          onPress: () => router.replace('/(auth)/login' as any),
        },
      ],
    );
  }, [router]);

  const fetchFamilies = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await getMyFamilies();
      
      if (Array.isArray(response)) {
        setFamilies(response);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        handleSessionExpired();
        return;
      }
      console.error('Error fetching families:', err);
      setError('Không thể tải danh sách gia đình. Vui lòng thử lại.');
      setFamilies([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [handleSessionExpired]);

  useEffect(() => {
    fetchFamilies();
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handleViewFamily = (familyId: number) => {
    router.push(`/(group)/${familyId}` as any);
  };

  const handleAddFamily = () => {
    // TODO: Điều hướng đến trang thêm gia đình
    console.log('Add family');
    // router.push('/(group)/create' as any);
  };

  const handleRefresh = () => {
    fetchFamilies(true);
  };

  return (
    <View style={groupStyles.container}>
      <StatusBar barStyle='dark-content' backgroundColor='#FFFFFF' />

      {/* Header */}
      <View style={groupStyles.header}>
        <TouchableOpacity onPress={handleBack} style={groupStyles.backButton}>
          <Ionicons name='arrow-back' size={24} color={COLORS.darkGrey} />
        </TouchableOpacity>

        <Text style={groupStyles.headerTitle}>Gia đình</Text>

        <View style={{ width: 32 }} />
      </View>

      {/* Family List */}
      {loading ? (
        <View style={groupStyles.loadingContainer}>
          <ActivityIndicator size='large' color={COLORS.blue} />
          <Text style={groupStyles.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <ScrollView
          style={groupStyles.scrollView}
          contentContainerStyle={groupStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.blue]}
              tintColor={COLORS.blue}
            />
          }
        >
          {error ? (
            <View style={groupStyles.errorContainer}>
              <Ionicons name='alert-circle-outline' size={48} color={COLORS.red} />
              <Text style={groupStyles.errorText}>{error}</Text>
              <TouchableOpacity
                style={groupStyles.retryButton}
                onPress={() => fetchFamilies()}
              >
                <Text style={groupStyles.retryButtonText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : families.length === 0 ? (
            <View style={groupStyles.emptyState}>
              <Ionicons name='people-outline' size={48} color={COLORS.grey} />
              <Text style={groupStyles.emptyStateText}>
                Chưa có gia đình nào
              </Text>
            </View>
          ) : (
            <>
              {families.map(family => (
                <View key={family.id} style={groupStyles.familyCard}>
                  <View style={groupStyles.familyIconContainer}>
                    <Ionicons name='people' size={28} color={COLORS.blue} />
                  </View>

                  <View style={groupStyles.familyInfo}>
                    <Text style={groupStyles.familyName}>{family.name}</Text>
                    <Text style={groupStyles.familyMembers}>
                      {family.memberCount} thành viên
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={groupStyles.viewButton}
                    onPress={() => handleViewFamily(family.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={groupStyles.viewButtonText}>Xem</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Add Family Button */}
              <TouchableOpacity
                style={groupStyles.addButton}
                onPress={handleAddFamily}
                activeOpacity={0.8}
              >
                <Ionicons name='add' size={24} color={COLORS.white} />
                <Text style={groupStyles.addButtonText}>Thêm gia đình</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

