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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { groupStyles } from '../../styles/group.styles';
import { COLORS } from '../../constants/themes';
import { getMyFamilies, getFamilyInvitationCode, joinFamilyByCode, createFamily, leaveFamily, deleteFamily, type Family } from '../../service/family';
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
      return null;
    }
    const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
    const decoded = decodeJWT(cleanToken);
    if (decoded && decoded.sub) {
      const userId = parseInt(decoded.sub, 10);
      return userId;
    }
    return null;
  } catch (error) {
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
  const [leavingFamilyId, setLeavingFamilyId] = useState<number | null>(null);
  const [deletingFamilyId, setDeletingFamilyId] = useState<number | null>(null);

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

  const handleLeaveFamily = useCallback(async (familyId: number) => {
    setLeavingFamilyId(familyId);
    try {
      await leaveFamily(familyId);
      Alert.alert(
        'Thành công',
        'Bạn đã rời khỏi nhóm thành công',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowFamilyMenu(false);
              fetchFamilies();
            },
          },
        ]
      );
    } catch (err: any) {
      try {
        if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
          handleSessionExpired();
          return;
        }
        
        // Extract error message from backend response
        // Backend returns: { statusCode, message, resultMessage: { vn, en } }
        const errorData = err?.response?.data || {};
        let errorMessage = 'Không thể rời khỏi nhóm. Vui lòng thử lại.';
        
        if (errorData && Object.keys(errorData).length > 0) {
          // Try resultMessage.vn first (Vietnamese message), then message, then resultMessage.en
          errorMessage = errorData.resultMessage?.vn || errorData.message || errorData.resultMessage?.en || errorMessage;
        } else if (err?.message) {
          errorMessage = err.message;
        }
        
        // Check if it's an owner error (400 Bad Request from backend)
        const resultCode = errorData.resultCode || errorData.code;
        const statusCode = err?.response?.status;
        const isOwnerError = statusCode === 400 && (
          errorMessage.includes('chuyển quyền') || 
          errorMessage.includes('owner') ||
          errorMessage.includes('chủ nhóm') ||
          resultCode === '00196' || // ResponseCode for owner must transfer ownership
          resultCode === '00195' || // ResponseCode for owner cannot leave if alone
          resultCode === 'C00196' ||
          resultCode === 'C00195'
        );
        
        if (isOwnerError) {
          // Show specific message based on resultCode
          if (resultCode === '00195' || resultCode === 'C00195') {
            // Only owner - can delete group or transfer ownership
            Alert.alert(
              'Không thể rời nhóm',
              'Bạn là chủ nhóm duy nhất. Vui lòng xóa nhóm hoặc chuyển quyền chủ nhóm trước khi rời.',
            );
          } else {
            // Has other members - must transfer ownership
            Alert.alert(
              'Không thể rời nhóm',
              'Bạn là chủ nhóm. Vui lòng chuyển quyền chủ nhóm cho thành viên khác trước khi rời nhóm.',
            );
          }
        } else {
          Alert.alert('Lỗi', errorMessage);
        }
      } catch (alertError) {
        // Fallback if Alert fails
      }
    } finally {
      setLeavingFamilyId(null);
    }
  }, [handleSessionExpired, fetchFamilies]);

  const handleDeleteFamily = useCallback(async (familyId: number) => {
    setDeletingFamilyId(familyId);
    try {
      await deleteFamily(familyId);
      Alert.alert(
        'Thành công',
        'Nhóm đã được xóa thành công',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowFamilyMenu(false);
              fetchFamilies();
            },
          },
        ]
      );
    } catch (err: any) {
      try {
        if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
          handleSessionExpired();
          return;
        }
        
        // Extract error message from backend response
        const errorData = err?.response?.data || {};
        let errorMessage = 'Không thể xóa nhóm. Vui lòng thử lại.';
        
        if (errorData && Object.keys(errorData).length > 0) {
          errorMessage = errorData.resultMessage?.vn || errorData.message || errorData.resultMessage?.en || errorMessage;
        } else if (err?.message) {
          errorMessage = err.message;
        }
        
        Alert.alert('Lỗi', errorMessage);
      } catch (alertError) {
      }
    } finally {
      setDeletingFamilyId(null);
    }
  }, [handleSessionExpired, fetchFamilies]);

  const getFamilyMenuOptions = () => {
    if (!selectedFamily) return [];
    
    // Kiểm tra xem user có phải owner không
    const isOwner = currentUserId && selectedFamily.owner_id && Number(currentUserId) === Number(selectedFamily.owner_id);
    
    // Kiểm tra xem user có phải manager không
    let isManager = false;
    if (currentUserId && selectedFamily.members && Array.isArray(selectedFamily.members)) {
      isManager = selectedFamily.members.some((member: any) => 
        member && Number(member.user_id) === Number(currentUserId) && member.role === 'manager'
      );
    }
    
    // Cho phép cả owner và manager xem mã mời và xóa nhóm
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
      // Chỉ hiển thị nút "Xóa nhóm" nếu user là owner hoặc manager
      ...(canViewInvitation ? [{
        label: deletingFamilyId === selectedFamily.id ? 'Đang xóa nhóm...' : 'Xóa nhóm',
        icon: 'trash-outline' as const,
        onPress: () => {
          if (deletingFamilyId === selectedFamily.id) return;
          Alert.alert(
            'Xác nhận xóa nhóm',
            'Bạn có chắc chắn muốn xóa nhóm này? Hành động này không thể hoàn tác và tất cả dữ liệu của nhóm sẽ bị xóa vĩnh viễn.',
            [
              { text: 'Hủy', style: 'cancel' },
              {
                text: 'Xóa nhóm',
                style: 'destructive',
                onPress: () => handleDeleteFamily(selectedFamily.id),
              },
            ]
          );
        },
        destructive: true,
      }] : []),
      {
        label: leavingFamilyId === selectedFamily.id ? 'Đang rời nhóm...' : 'Rời nhóm',
        icon: 'log-out-outline' as const,
        onPress: () => {
          if (leavingFamilyId === selectedFamily.id) return;
          Alert.alert(
            'Xác nhận',
            'Bạn có chắc chắn muốn rời khỏi nhóm này?',
            [
              { text: 'Hủy', style: 'cancel' },
              {
                text: 'Rời nhóm',
                style: 'destructive',
                onPress: () => handleLeaveFamily(selectedFamily.id),
              },
            ]
          );
        },
        destructive: true,
        disabled: leavingFamilyId === selectedFamily.id,
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
          keyboardVerticalOffset={0}
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
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 24,
                maxHeight: '50%',
                shadowColor: '#000',
                shadowOffset: {
                  width: 0,
                  height: -2,
                },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 10,
              }}
            >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 24,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: 'bold',
                      color: COLORS.darkGrey,
                    }}
                  >
                    Tạo gia đình mới
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowCreateModal(false);
                      setNewFamilyName('');
                    }}
                    activeOpacity={0.7}
                    style={{
                      padding: 4,
                      borderRadius: 20,
                      backgroundColor: COLORS.lightGrey,
                    }}
                  >
                    <Ionicons name="close" size={20} color={COLORS.darkGrey} />
                  </TouchableOpacity>
                </View>

                <View style={{ marginBottom: 20 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '600',
                      color: COLORS.darkGrey,
                      marginBottom: 10,
                    }}
                  >
                    Tên gia đình <Text style={{ color: COLORS.red || '#EF4444' }}>*</Text>
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: COLORS.lightGrey || '#F5F5F5',
                      borderRadius: 12,
                      padding: 16,
                      fontSize: 16,
                      borderWidth: 1,
                      borderColor: COLORS.lightGrey || '#E5E5E5',
                      color: COLORS.darkGrey,
                    }}
                    placeholder="Nhập tên gia đình"
                    value={newFamilyName}
                    onChangeText={setNewFamilyName}
                    placeholderTextColor={COLORS.grey}
                  />
                </View>

                <View
                  style={{
                    backgroundColor: COLORS.lightBlue || '#E0F2FE',
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 24,
                    borderLeftWidth: 3,
                    borderLeftColor: '#0EA5E9',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <Ionicons name="information-circle" size={18} color="#0EA5E9" style={{ marginRight: 10, marginTop: 2 }} />
                    <Text style={{ fontSize: 13, color: '#0369A1', flex: 1, lineHeight: 18 }}>
                      Bạn sẽ trở thành chủ hộ của gia đình này
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={{
                    backgroundColor: COLORS.primary || COLORS.green || '#15803D',
                    borderRadius: 12,
                    padding: 16,
                    alignItems: 'center',
                    shadowColor: COLORS.primary || COLORS.green || '#15803D',
                    shadowOffset: {
                      width: 0,
                      height: 4,
                    },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 5,
                  }}
                  onPress={handleCreateFamily}
                  disabled={creatingFamily}
                  activeOpacity={0.8}
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
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
