import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { groupStyles } from '../../styles/group.styles';
import { COLORS } from '../../constants/themes';
import { getMyFamilies, getFamilyInvitationCode, joinFamilyByCode, createFamily, type Family } from '../../service/family';
import { getFamilySharedLists } from '../../service/shopping';
import { getAccess } from '../../utils/api';
import ActionMenu from '../../components/ActionMenu';
import InvitationModal from '../../components/InvitationModal';
import JoinFamilyModal from '../../components/JoinFamilyModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FamilyWithStats extends Family {
  memberCount: number;
  invitation_code?: string | null;
  shoppingListInfo?: {
    thisWeekItems?: number;
    boughtItems?: number;
    totalItems?: number;
  };
}

// Helper function to decode JWT and get user ID
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

// Helper function to get current user ID from JWT token
const getCurrentUserId = async (): Promise<number | null> => {
  try {
    const token = await AsyncStorage.getItem('access_token');
    if (!token) {
      console.log('[Group Page] No token found');
      return null;
    }
    const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
    const decoded = decodeJWT(cleanToken);
    if (decoded && decoded.sub) {
      const userId = parseInt(decoded.sub, 10);
      console.log('[Group Page] Decoded user ID from token:', { sub: decoded.sub, userId });
      return userId;
    }
    console.log('[Group Page] No sub in decoded token:', decoded);
    return null;
  } catch (error) {
    console.error('[Group Page] Error getting current user ID:', error);
    return null;
  }
};

export default function GroupPage() {
  const router = useRouter();
  const [families, setFamilies] = useState<FamilyWithStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showFamilyMenu, setShowFamilyMenu] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<FamilyWithStats | null>(null);
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [creatingFamily, setCreatingFamily] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

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
      
      // getMyFamilies always returns an array
      const familiesData = Array.isArray(response) ? response : [];
      
      // Fetch shopping list statistics for each family
      const familiesWithStats: FamilyWithStats[] = await Promise.all(
        familiesData.map(async (family) => {
          const memberCount = family.members?.length || 0;
          
          // Get shopping lists for this family
          let shoppingListInfo = {};
          try {
            const sharedLists = await getFamilySharedLists(family.id);
            
            // Calculate this week's items
            const now = new Date();
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            
            const thisWeekLists = (sharedLists || []).filter((list: any) => {
              const listDate = new Date(list.created_at || list.shopping_date);
              return listDate >= startOfWeek;
            });
            
            const thisWeekItems = thisWeekLists.reduce((total: number, list: any) => {
              return total + (list.items?.length || 0);
            }, 0);
            
            // Calculate bought items from all lists
            const allItems = sharedLists.reduce((total: number, list: any) => {
              return total + (list.items?.length || 0);
            }, 0);
            
            const boughtItems = sharedLists.reduce((total: number, list: any) => {
              const checked = list.items?.filter((item: any) => item.is_checked) || [];
              return total + checked.length;
            }, 0);
            
            shoppingListInfo = {
              thisWeekItems,
              boughtItems,
              totalItems: allItems,
            };
          } catch (error) {
            console.error(`Error fetching shopping stats for family ${family.id}:`, error);
          }
          
          return {
            ...family,
            memberCount,
            shoppingListInfo,
          };
        })
      );
      
      setFamilies(familiesWithStats);
    } catch (err: any) {
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        handleSessionExpired();
        return;
      }
      console.error('Error fetching families:', err);
      setError('Không thể tải danh sách nhóm. Vui lòng thử lại.');
      setFamilies([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [handleSessionExpired]);

  useEffect(() => {
    fetchFamilies();
  }, [fetchFamilies]);

  // Load current user ID
  useEffect(() => {
    const loadCurrentUserId = async () => {
      const userId = await getCurrentUserId();
      setCurrentUserId(userId);
    };
    loadCurrentUserId();
  }, []);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home' as any);
    }
  };

  const handleHeaderMenu = () => {
    setShowHeaderMenu(true);
  };

  const getHeaderMenuOptions = () => {
    return [
      {
        label: 'Tham gia nhóm',
        icon: 'qr-code-outline' as const,
        onPress: () => {
          setShowHeaderMenu(false);
          setShowJoinModal(true);
        },
      },
      {
        label: 'Thông báo',
        icon: 'notifications-outline' as const,
        onPress: () => {
          setShowHeaderMenu(false);
          router.push('/(notifications)' as any);
        },
      },
    ];
  };

  const handleViewFamily = (family: FamilyWithStats) => {
    router.push(`/(group)/${family.id}` as any);
  };

  const handleFamilyMenu = (family: FamilyWithStats) => {
    setSelectedFamily(family);
    setShowFamilyMenu(true);
  };

  const getFamilyMenuOptions = () => {
    if (!selectedFamily) return [];
    
    // Kiểm tra xem user có phải owner không
    const isOwner = currentUserId && selectedFamily.owner_id && currentUserId === selectedFamily.owner_id;
    
    // Kiểm tra xem user có phải manager không
    const isManager = currentUserId && selectedFamily.members && 
      selectedFamily.members.some((member: any) => 
        member.user_id === currentUserId && member.role === 'manager'
      );
    
    // Cho phép cả owner và manager xem mã mời
    const canViewInvitation = isOwner || isManager;
    
    return [
      {
        label: 'Xem chi tiết',
        icon: 'eye-outline' as const,
        onPress: () => handleViewFamily(selectedFamily),
      },
      // Chỉ hiển thị nút "Mã mời" nếu user là owner hoặc manager
      ...(canViewInvitation ? [{
        label: 'Mã mời',
        icon: 'qr-code-outline' as const,
        onPress: () => {
          setShowInvitationModal(true);
        },
      }] : []),
      {
        label: 'Rời nhóm',
        icon: 'log-out-outline' as const,
        onPress: () => {
          Alert.alert(
            'Xác nhận',
            'Bạn có chắc chắn muốn rời khỏi nhóm này?',
            [
              { text: 'Hủy', style: 'cancel' },
              {
                text: 'Rời nhóm',
                style: 'destructive',
                onPress: () => {
                  // TODO: Implement leave family
                  console.log('Leave family:', selectedFamily.id);
                },
              },
            ]
          );
        },
        destructive: true,
      },
    ];
  };

  const handleAddFamily = () => {
    setShowCreateModal(true);
  };

  const handleCreateFamily = async () => {
    if (!newFamilyName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên gia đình');
      return;
    }

    setCreatingFamily(true);
    try {
      // Get user profile to get owner_id
      const response = await getAccess('auth/profile');
      // API response có cấu trúc: { success, message, data: { ...userInfo } }
      const userProfile = response?.data || response;
      
      const ownerId = typeof userProfile.id === 'string' 
        ? parseInt(userProfile.id, 10) 
        : Number(userProfile.id);
      
      if (isNaN(ownerId)) {
        Alert.alert('Lỗi', 'ID người dùng không hợp lệ');
        setCreatingFamily(false);
        return;
      }

      const data: any = {
        name: newFamilyName.trim(),
        owner_id: ownerId,
      };

      await createFamily(data);

      Alert.alert('Thành công', 'Đã tạo gia đình thành công!', [
        {
          text: 'OK',
          onPress: () => {
            setShowCreateModal(false);
            setNewFamilyName('');
            fetchFamilies();
          },
        },
      ]);
    } catch (err: any) {
      console.error('Error creating family:', err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể tạo gia đình. Vui lòng thử lại.';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setCreatingFamily(false);
    }
  };

  const handleJoinFamily = async (invitationCode: string) => {
    try {
      const response = await joinFamilyByCode(invitationCode);
      
      // Handle both direct object and wrapped response
      const result = response?.data || response;
      
      if (result?.message || result?.family) {
        Alert.alert(
          'Thành công',
          `Đã tham gia nhóm ${result.family?.name || 'thành công'}!`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Refresh families list
                fetchFamilies();
              },
            },
          ]
        );
      } else {
        Alert.alert('Thành công', 'Đã tham gia nhóm thành công!', [
          {
            text: 'OK',
            onPress: () => {
              fetchFamilies();
            },
          },
        ]);
      }
    } catch (error: any) {
      console.error('Error joining family:', error);
      
      let errorMessage = 'Không thể tham gia nhóm. Vui lòng thử lại.';
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Lỗi', errorMessage);
      throw error;
    }
  };

  const getFamilyAvatar = (family: FamilyWithStats) => {
    // You can customize this to show different avatars
    // For now, using a default icon
    return null;
  };

  const renderFamilyCard = (family: FamilyWithStats) => {
    const avatar = getFamilyAvatar(family);
    const shoppingInfo = family.shoppingListInfo;
    
    return (
      <TouchableOpacity
        key={family.id}
        style={groupStyles.familyCard}
        onPress={() => handleViewFamily(family)}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={groupStyles.familyAvatarContainer}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={groupStyles.familyAvatar} />
          ) : (
            <View style={groupStyles.familyAvatarPlaceholder}>
              <Ionicons name="people" size={28} color={COLORS.orange} />
            </View>
          )}
        </View>

        {/* Family Info */}
        <View style={groupStyles.familyInfo}>
          <Text style={groupStyles.familyName}>{family.name}</Text>
          
          {shoppingInfo?.thisWeekItems !== undefined ? (
            <Text style={groupStyles.familyDetails}>
              Danh sách tuần này: {shoppingInfo.thisWeekItems} món đồ
            </Text>
          ) : shoppingInfo?.boughtItems !== undefined && shoppingInfo?.totalItems !== undefined ? (
            <Text style={groupStyles.familyDetails}>
              Đã mua {shoppingInfo.boughtItems}/{shoppingInfo.totalItems} món
            </Text>
          ) : null}
          
          <Text style={groupStyles.familyMembers}>
            {family.memberCount} thành viên
          </Text>
        </View>

        {/* Menu Button */}
        <TouchableOpacity
          style={groupStyles.menuButton}
          onPress={() => handleFamilyMenu(family)}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={COLORS.darkGrey} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const handleRefresh = () => {
    fetchFamilies(true);
  };

  return (
    <View style={groupStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={groupStyles.header}>
        <TouchableOpacity onPress={handleBack} style={groupStyles.headerIcon}>
          <Ionicons name="arrow-back" size={24} color={COLORS.darkGrey} />
        </TouchableOpacity>

        <Text style={groupStyles.headerTitle}>Nhóm Mua Sắm</Text>

        <TouchableOpacity onPress={handleHeaderMenu} style={groupStyles.headerIcon}>
          <Ionicons name="ellipsis-vertical" size={24} color={COLORS.darkGrey} />
        </TouchableOpacity>
      </View>

      {/* Family List */}
      {loading ? (
        <View style={groupStyles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.purple} />
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
              colors={[COLORS.purple]}
              tintColor={COLORS.purple}
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
              <Ionicons name="people-outline" size={48} color={COLORS.grey} />
              <Text style={groupStyles.emptyStateText}>
                Chưa có nhóm nào
              </Text>
              <Text style={groupStyles.emptyStateSubtext}>
                Tạo hoặc tham gia nhóm để bắt đầu mua sắm cùng nhau
              </Text>
            </View>
          ) : (
            <>
              {families.map(renderFamilyCard)}

              {/* Floating Action Button */}
              <TouchableOpacity
                style={groupStyles.fab}
                onPress={handleAddFamily}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={28} color={COLORS.white} />
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      )}

      {/* Header Menu */}
      <ActionMenu
        visible={showHeaderMenu}
        onClose={() => {
          setShowHeaderMenu(false);
        }}
        title="Tùy chọn"
        options={getHeaderMenuOptions()}
      />

      {/* Family Menu */}
      <ActionMenu
        visible={showFamilyMenu}
        onClose={() => {
          setShowFamilyMenu(false);
        }}
        title={selectedFamily?.name || 'Nhóm'}
        options={getFamilyMenuOptions()}
      />

      {/* Invitation Modal */}
      {selectedFamily && (
        <InvitationModal
          visible={showInvitationModal}
          onClose={() => {
            setShowInvitationModal(false);
          }}
          familyId={selectedFamily.id}
          familyName={selectedFamily.name}
          onFetchInvitation={async (id: number) => {
            const response = await getFamilyInvitationCode(id);
            // Handle both direct object and wrapped response
            return response?.data || response;
          }}
        />
      )}

      {/* Join Family Modal */}
      <JoinFamilyModal
        visible={showJoinModal}
        onClose={() => {
          setShowJoinModal(false);
        }}
        onJoin={handleJoinFamily}
      />

      {/* Create Family Modal */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowCreateModal(false);
          setNewFamilyName('');
        }}
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
              padding: 20,
              maxHeight: '50%',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: COLORS.darkGrey,
                }}
              >
                Tạo gia đình mới
              </Text>
              <TouchableOpacity onPress={() => {
                setShowCreateModal(false);
                setNewFamilyName('');
              }}>
                <Ionicons name="close" size={24} color={COLORS.darkGrey} />
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 20 }}>
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
                  backgroundColor: COLORS.background || '#F5F5F5',
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: COLORS.background || '#E5E5E5',
                }}
                placeholder="Nhập tên gia đình"
                value={newFamilyName}
                onChangeText={setNewFamilyName}
                placeholderTextColor={COLORS.grey}
              />
            </View>

            <View
              style={{
                backgroundColor: '#E0F2FE',
                borderRadius: 12,
                padding: 12,
                marginBottom: 20,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Ionicons name="information-circle" size={18} color="#0EA5E9" style={{ marginRight: 8, marginTop: 2 }} />
                <Text style={{ fontSize: 12, color: '#0369A1', flex: 1, lineHeight: 16 }}>
                  Bạn sẽ trở thành chủ hộ của gia đình này
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: COLORS.purple || '#A855F7',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
              }}
              onPress={handleCreateFamily}
              disabled={creatingFamily}
            >
              {creatingFamily ? (
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
          </View>
        </View>
      </Modal>
    </View>
  );
}
