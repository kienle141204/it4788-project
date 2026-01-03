import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
  TextInput,
  Modal,
  FlatList,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { groupStyles } from '../../styles/group.styles';
import { COLORS } from '../../constants/themes';
import { getFamilyById, getFamilyInvitationCode, leaveFamily, deleteFamily } from '../../service/family';
import {
  getShoppingListsByFamily,
  createShoppingList,
  addItemToList,
  toggleItemChecked,
  deleteShoppingItem,
  updateShoppingItem,
  deleteShoppingList,
  type ShoppingList,
  type ShoppingItem,
} from '../../service/shoppingList';
import { searchIngredients } from '../../service/market';
import { getAccess } from '../../utils/api';
import { getCachedAccess, refreshCachedAccess, CACHE_TTL } from '../../utils/cachedApi';
import { clearCacheByPattern } from '../../utils/cache';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ActionMenu from '../../components/ActionMenu';
import InvitationModal from '../../components/InvitationModal';
import GroupStatistics from '../../components/GroupStatistics';
import { getChatMessages, sendChatMessage, type ChatMessage, type ChatMessagesResponse, connectChatSocket, disconnectChatSocket, joinChatRoom, leaveChatRoom, sendMessageWS, onNewMessage } from '../../service/chat';

const defaultAvatar = require('../../assets/images/avatar.png');

// Helper function to format currency consistently
const formatCurrency = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined || amount === '') {
    return '0đ';
  }
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) {
    return '0đ';
  }
  // Round to integer and format with thousand separators
  // Use default locale which works better on React Native
  return `${Math.round(numAmount).toLocaleString()}đ`;
};

// InfoRow component for member profile
const InfoRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <View style={{
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  }}>
    <View style={{
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#EEF2FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    }}>
      <Ionicons name={icon as any} size={18} color={COLORS.purple} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{
        fontSize: 12,
        color: COLORS.grey,
        marginBottom: 2,
      }}>
        {label}
      </Text>
      <Text style={{
        fontSize: 15,
        color: COLORS.darkGrey,
        fontWeight: '500',
      }}>
        {value}
      </Text>
    </View>
  </View>
);

interface Member {
  id: number;
  user_id: number;
  role: string;
  joined_at: string;
  user: {
    id: number;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

interface Family {
  id: number;
  name: string;
  owner_id: number;
  created_at: string;
  invitation_code?: string | null;
  members?: Array<{
    id: number;
    user_id: number;
    role: string;
    joined_at: string;
    user?: {
      id: number;
      full_name?: string;
      fullname?: string;
      email: string;
      avatar_url?: string | null;
    };
  }>;
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

export default function GroupDetailPage() {
  const router = useRouter();
  const { id, tab } = useLocalSearchParams();
  const familyId = parseInt(id as string);

  // Đọc query param 'tab' để hỗ trợ deep linking từ notification
  const initialTab = (tab === 'chat' ? 'chat' : tab === 'statistics' ? 'statistics' : 'shopping') as 'shopping' | 'chat' | 'statistics';
  const [activeTab, setActiveTab] = useState<'shopping' | 'chat' | 'statistics'>(initialTab);
  const [showMembersView, setShowMembersView] = useState(false);
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Shopping list states
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateOffset, setDateOffset] = useState<number>(0);
  const [showAddListModal, setShowAddListModal] = useState<boolean>(false);
  const [showAddItemModal, setShowAddItemModal] = useState<boolean>(false);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [newItemIngredientId, setNewItemIngredientId] = useState<number | null>(null);
  const [newItemStock, setNewItemStock] = useState<string>('500');
  const [newItemPrice, setNewItemPrice] = useState<string>('');

  // Create list states
  const [showAssignMemberDropdown, setShowAssignMemberDropdown] = useState<boolean>(false);
  const [assignedOwner, setAssignedOwner] = useState<Member | null>(null);

  // Ingredient search states
  const [ingredientSearchTerm, setIngredientSearchTerm] = useState<string>('');
  const [searchedIngredients, setSearchedIngredients] = useState<any[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<any>(null);
  const [loadingIngredients, setLoadingIngredients] = useState<boolean>(false);

  // Edit item states
  const [showEditItemModal, setShowEditItemModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [editItemStock, setEditItemStock] = useState<string>('');
  const [editItemPrice, setEditItemPrice] = useState<string>('');

  // Menu states
  const [showFamilyMenu, setShowFamilyMenu] = useState(false);
  const [showMemberMenu, setShowMemberMenu] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showInvitationModal, setShowInvitationModal] = useState(false);

  // Member profile states
  const [showMemberProfileModal, setShowMemberProfileModal] = useState(false);
  const [memberProfile, setMemberProfile] = useState<any>(null);
  const [loadingMemberProfile, setLoadingMemberProfile] = useState(false);

  // Leave family state
  const [leavingFamily, setLeavingFamily] = useState<boolean>(false);

  // Delete family state
  const [deletingFamily, setDeletingFamily] = useState<boolean>(false);

  // Chat states
  // Extend ChatMessage with optional status for local state
  type LocalChatMessage = ChatMessage & { status?: 'sending' | 'sent' | 'failed' };
  const [chatMessages, setChatMessages] = useState<LocalChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const chatLastIdRef = useRef<number | null>(null);
  const tempMessageIdRef = useRef<number>(-1); // Use negative IDs for temporary messages
  const pendingTempMessagesRef = useRef<Map<number, { tempId: number; message: string; timestamp: number }>>(new Map()); // Track pending temp messages

  // Refs for scrolling
  const chatListRef = useRef<FlatList<ChatMessage>>(null);
  const tabScrollRef = useRef<ScrollView>(null);
  const shouldScrollToEndRef = useRef(true);

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

  const fetchFamilyData = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch family details with caching
      let familyData: any;
      if (isRefreshing) {
        // Force refresh: always fetch from API
        const result = await refreshCachedAccess<any>(
          `families/${familyId}`,
          {},
          {
            ttl: CACHE_TTL.LONG,
            cacheKey: `group:family:${familyId}`,
            compareData: true,
          }
        );
        familyData = result.data?.data || result.data;
      } else {
        // Normal fetch: use cache if available
        const result = await getCachedAccess<any>(
          `families/${familyId}`,
          {},
          {
            ttl: CACHE_TTL.LONG,
            cacheKey: `group:family:${familyId}`,
            compareData: true,
          }
        );
        familyData = result.data?.data || result.data;
        
        // If we got data from cache, fetch fresh data in background
        if (result.fromCache) {
          refreshCachedAccess<any>(
            `families/${familyId}`,
            {},
            {
              ttl: CACHE_TTL.LONG,
              cacheKey: `group:family:${familyId}`,
              compareData: true,
            }
          ).then((freshResult) => {
            if (freshResult.updated) {
              const freshData = freshResult.data?.data || freshResult.data;
              // Process fresh data
              processFamilyData(freshData);
            }
          }).catch(() => {
            // Silently fail background refresh
          });
        }
      }
      
      // Process family data
      await processFamilyData(familyData);
    } catch (err: any) {
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        handleSessionExpired();
        return;
      }
      setError('Không thể tải thông tin gia đình. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [familyId, handleSessionExpired]);

  // Process family data (extract members, shopping lists, etc.)
  const processFamilyData = useCallback(async (familyData: any) => {
    // Cast to local Family type
    setFamily({
      id: familyData.id,
      name: familyData.name,
      owner_id: familyData.owner_id,
      created_at: familyData.created_at,
      invitation_code: (familyData as any).invitation_code || null,
      members: familyData.members as any,
    });

    // Extract members from family object and transform to Member[] format
    let membersData: Member[] = [];

    if (familyData.members && Array.isArray(familyData.members)) {
      membersData = familyData.members.map((member: any) => ({
        id: member.id,
        user_id: member.user_id,
        role: member.role || 'member', // Đảm bảo có role, mặc định là 'member'
        joined_at: member.joined_at,
        user: {
          id: member.user?.id || member.user_id,
          full_name: member.user?.full_name || member.user?.fullname || '',
          email: member.user?.email || '',
          avatar_url: member.user?.avatar_url || null,
        },
      }));
    }

    // Đảm bảo owner có role đúng và được hiển thị
    if (familyData.owner_id) {
      const ownerMemberIndex = membersData.findIndex(m => m.user_id === familyData.owner_id);
      if (ownerMemberIndex >= 0) {
        // Owner đã có trong members, đảm bảo role là 'owner'
        membersData[ownerMemberIndex].role = 'owner';
      } else if (familyData.owner) {
        // Owner chưa có trong members, thêm vào đầu danh sách
        const ownerMember: Member = {
          id: 0, // Temporary ID
          user_id: familyData.owner_id,
          role: 'owner', // Owner có role đặc biệt
          joined_at: familyData.created_at || new Date().toISOString(),
          user: {
            id: familyData.owner.id || familyData.owner_id,
            full_name: familyData.owner?.fullname || familyData.owner?.fullname || 'Người dùng',
            email: familyData.owner.email || '',
            avatar_url: familyData.owner.avatar_url || null,
          },
        };
        membersData.unshift(ownerMember);
      } else {
      }
    }

    // Fetch shopping lists with caching (handle error gracefully)
    let shoppingListsData: ShoppingList[] = [];
    try {
      const result = await getCachedAccess<ShoppingList[]>(
        `shopping-lists/my-family-shared/${familyId}`,
        {},
        {
          ttl: CACHE_TTL.MEDIUM,
          cacheKey: `group:family:${familyId}:shopping-lists`,
          compareData: true,
        }
      );
      shoppingListsData = Array.isArray(result.data) ? result.data : [];
      
      // If we got data from cache, fetch fresh data in background
      if (result.fromCache) {
        refreshCachedAccess<ShoppingList[]>(
          `shopping-lists/my-family-shared/${familyId}`,
          {},
          {
            ttl: CACHE_TTL.MEDIUM,
            cacheKey: `group:family:${familyId}:shopping-lists`,
            compareData: true,
          }
        ).then((freshResult) => {
          if (freshResult.updated) {
            const freshData = Array.isArray(freshResult.data) ? freshResult.data : [];
            setShoppingLists(freshData);
          }
        }).catch(() => {
          // Silently fail background refresh
        });
      }
    } catch (shoppingError: any) {
      // Continue without shopping lists if endpoint fails
    }

    setMembers(membersData);
    setShoppingLists(shoppingListsData);
  }, [familyId]);

  // Fetch only shopping lists (optimized for faster updates) with caching
  const fetchShoppingLists = useCallback(async (isRefreshing = false) => {
    try {
      let result;
      if (isRefreshing) {
        // Force refresh: always fetch from API
        result = await refreshCachedAccess<ShoppingList[]>(
          `shopping-lists/my-family-shared/${familyId}`,
          {},
          {
            ttl: CACHE_TTL.MEDIUM,
            cacheKey: `group:family:${familyId}:shopping-lists`,
            compareData: true,
          }
        );
        const shoppingListsData = Array.isArray(result.data) ? result.data : [];
        setShoppingLists(shoppingListsData);
      } else {
        // Normal fetch: use cache if available
        result = await getCachedAccess<ShoppingList[]>(
          `shopping-lists/my-family-shared/${familyId}`,
          {},
          {
            ttl: CACHE_TTL.MEDIUM,
            cacheKey: `group:family:${familyId}:shopping-lists`,
            compareData: true,
          }
        );
        const shoppingListsData = Array.isArray(result.data) ? result.data : [];
        setShoppingLists(shoppingListsData);
        
        // If we got data from cache, fetch fresh data in background
        if (result.fromCache) {
          refreshCachedAccess<ShoppingList[]>(
            `shopping-lists/my-family-shared/${familyId}`,
            {},
            {
              ttl: CACHE_TTL.MEDIUM,
              cacheKey: `group:family:${familyId}:shopping-lists`,
              compareData: true,
            }
          ).then((freshResult) => {
            if (freshResult.updated) {
              const freshData = Array.isArray(freshResult.data) ? freshResult.data : [];
              setShoppingLists(freshData);
            }
          }).catch(() => {
            // Silently fail background refresh
          });
        }
      }
    } catch (error) {
      // Don't show error to user, just log it
    }
  }, [familyId]);

  // Get current user ID from JWT token
  useEffect(() => {
    const loadCurrentUserId = async () => {
      const userId = await getCurrentUserId();
      setCurrentUserId(userId);
    };
    loadCurrentUserId();
  }, []);

  useEffect(() => {
    fetchFamilyData();
  }, []);

  // Reload data when page comes into focus (to sync with calendar page)
  useFocusEffect(
    useCallback(() => {
      fetchFamilyData(true); // Skip loading state for smoother UX
    }, [fetchFamilyData])
  );

  // Find current member and check if they are a manager
  const currentMember = useMemo(() => {
    if (!currentUserId || !members.length) {
      return null;
    }

    // Convert both to numbers for comparison to avoid type mismatch
    const foundMember = members.find(member => Number(member.user_id) === Number(currentUserId)) || null;

    return foundMember;
  }, [currentUserId, members]);

  const isManager = useMemo(() => {
    const result = currentMember?.role === 'manager';
    return result;
  }, [currentMember]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home' as any);
    }
  };

  const handleMenu = () => {
    setShowFamilyMenu(true);
  };

  const handleLeaveFamily = useCallback(async () => {
    if (!family) return;

    setLeavingFamily(true);
    try {
      await leaveFamily(family.id);
      
      // Invalidate cache when leaving family
      await clearCacheByPattern('group:families');
      await clearCacheByPattern(`group:family:${family.id}`);
      
      Alert.alert(
        'Thành công',
        'Bạn đã rời khỏi nhóm thành công',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/(group)' as any);
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
      setLeavingFamily(false);
    }
  }, [family, router, handleSessionExpired]);

  const handleDeleteFamily = useCallback(async () => {
    if (!family) return;

    setDeletingFamily(true);
    try {
      await deleteFamily(family.id);
      
      // Invalidate cache when deleting family
      await clearCacheByPattern('group:families');
      await clearCacheByPattern(`group:family:${family.id}`);
      
      Alert.alert(
        'Thành công',
        'Nhóm đã được xóa thành công',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/(group)' as any);
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
      setDeletingFamily(false);
    }
  }, [family, router, handleSessionExpired]);

  const getFamilyMenuOptions = () => {
    if (!family) return [];

    // Kiểm tra xem user có phải owner không
    const isOwner = currentUserId && family.owner_id && Number(currentUserId) === Number(family.owner_id);

    // isManager đã được tính từ useMemo ở trên
    const canDelete = isOwner || isManager;

    return [
      {
        label: 'Thành viên nhóm',
        icon: 'people-outline' as const,
        onPress: () => {
          setShowMembersView(true);
        },
      },
      // Chỉ hiển thị nút "Mã mời" nếu user là owner hoặc manager của family
      ...(canDelete ? [{
        label: 'Mã mời',
        icon: 'qr-code-outline' as const,
        onPress: () => {
          setShowInvitationModal(true);
        },
      }] : []),
      // Chỉ hiển thị nút "Xóa nhóm" nếu user là owner hoặc manager của family
      ...(canDelete ? [{
        label: deletingFamily ? 'Đang xóa nhóm...' : 'Xóa nhóm',
        icon: 'trash-outline' as const,
        onPress: () => {
          if (deletingFamily) return;
          Alert.alert(
            'Xác nhận xóa nhóm',
            'Bạn có chắc chắn muốn xóa nhóm này? Hành động này không thể hoàn tác và tất cả dữ liệu của nhóm sẽ bị xóa vĩnh viễn.',
            [
              { text: 'Hủy', style: 'cancel' },
              {
                text: 'Xóa nhóm',
                style: 'destructive',
                onPress: handleDeleteFamily,
              },
            ]
          );
        },
        destructive: true,
      }] : []),
      {
        label: 'Chỉnh sửa thông tin',
        icon: 'create-outline' as const,
        onPress: () => {
          // TODO: Navigate to edit family
        },
      },
      {
        label: 'Cài đặt',
        icon: 'settings-outline' as const,
        onPress: () => {
          // TODO: Navigate to settings
        },
      },
      {
        label: leavingFamily ? 'Đang rời nhóm...' : 'Rời khỏi nhóm',
        icon: 'log-out-outline' as const,
        onPress: () => {
          if (leavingFamily) return;
          Alert.alert(
            'Xác nhận',
            'Bạn có chắc chắn muốn rời khỏi nhóm này?',
            [
              { text: 'Hủy', style: 'cancel' },
              {
                text: 'Rời nhóm',
                style: 'destructive',
                onPress: handleLeaveFamily,
              },
            ]
          );
        },
        destructive: true,
        disabled: leavingFamily,
      },
    ];
  };

  const handleMemberMenu = (member: Member) => {
    setShowMembersView(false);
    setSelectedMember(member);
    setShowMemberMenu(true);
  };

  const fetchMemberProfile = useCallback(async (userId: number) => {
    setLoadingMemberProfile(true);
    try {
      // Use cached API for user profile
      const result = await getCachedAccess<any>(
        `users/${userId}`,
        {},
        {
          ttl: CACHE_TTL.LONG,
          cacheKey: `user:profile:${userId}`,
          compareData: true,
        }
      );
      
      const payload = result.data;
      if (payload?.success !== false && payload?.data) {
        setMemberProfile(payload.data);
        setShowMemberProfileModal(true);
      } else if (payload && !payload.success) {
        throw new Error(payload?.message || 'Không thể tải thông tin thành viên');
      } else {
        // Handle direct data response
        setMemberProfile(payload);
        setShowMemberProfileModal(true);
      }
    } catch (err: any) {
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        handleSessionExpired();
        return;
      }
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải thông tin thành viên';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoadingMemberProfile(false);
    }
  }, [handleSessionExpired]);

  const getMemberMenuOptions = () => {
    if (!selectedMember) return [];

    const isCurrentUser = selectedMember.user_id === currentUserId;
    const isMemberManager = selectedMember.role === 'manager';
    const options = [];

    options.push({
      label: 'Xem thông tin',
      icon: 'person-outline' as const,
      onPress: () => {
        setShowMemberMenu(false);
        fetchMemberProfile(selectedMember.user_id);
      },
    });

    if (!isCurrentUser && isManager) {
      if (isMemberManager) {
        options.push({
          label: 'Bỏ quyền quản trị',
          icon: 'shield-outline' as const,
          onPress: () => {
            Alert.alert(
              'Xác nhận',
              'Bạn có chắc chắn muốn bỏ quyền quản trị của thành viên này?',
              [
                { text: 'Hủy', style: 'cancel' },
                {
                  text: 'Xác nhận',
                  onPress: () => {
                    // TODO: Remove manager role
                  },
                },
              ]
            );
          },
        });
      } else {
        options.push({
          label: 'Cấp quyền quản trị',
          icon: 'shield-checkmark-outline' as const,
          onPress: () => {
            Alert.alert(
              'Xác nhận',
              'Bạn có chắc chắn muốn cấp quyền quản trị cho thành viên này?',
              [
                { text: 'Hủy', style: 'cancel' },
                {
                  text: 'Xác nhận',
                  onPress: () => {
                    // TODO: Grant manager role
                  },
                },
              ]
            );
          },
        });
      }

      options.push({
        label: 'Xóa khỏi nhóm',
        icon: 'person-remove-outline' as const,
        onPress: () => {
          Alert.alert(
            'Xác nhận',
            'Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm?',
            [
              { text: 'Hủy', style: 'cancel' },
              {
                text: 'Xóa',
                style: 'destructive',
                onPress: () => {
                  // TODO: Remove member
                },
              },
            ]
          );
        },
        destructive: true,
      });
    }

    return options;
  };

  const handleRefresh = () => {
    fetchFamilyData(true);
    if (activeTab === 'chat') {
      fetchChatMessages();
    }
  };

  // ============ CHAT FUNCTIONS ============
  const fetchChatMessages = useCallback(async (loadMore = false) => {
    if (loadMore) {
      setLoadingMoreMessages(true);
    } else {
      setChatLoading(true);
      // Reset cursor when doing fresh load
      chatLastIdRef.current = null;
    }
    try {
      const lastId = loadMore ? chatLastIdRef.current : undefined;
      
      // For chat messages, use shorter TTL since they're real-time
      // Only cache initial load, not pagination
      if (loadMore) {
        // Load more: always fetch fresh (no cache for pagination)
        const response = await getChatMessages(familyId, 10, lastId ?? undefined);
        
        // Prepend older messages - don't scroll
        shouldScrollToEndRef.current = false;
        setChatMessages(prev => [
          ...response.data.map((msg): LocalChatMessage => ({ ...msg, status: 'sent' })),
          ...prev
        ]);
        setHasMoreMessages(response.pagination.hasMore);
        chatLastIdRef.current = response.pagination.lastId;
      } else {
        // Initial load: use cache with short TTL, only load 10 most recent messages
        const cacheKey = `group:family:${familyId}:chat:messages`;
        const result = await getCachedAccess<ChatMessagesResponse>(
          `chat/family/${familyId}?limit=10`,
          {},
          {
            ttl: CACHE_TTL.SHORT, // Short TTL for real-time chat
            cacheKey,
            compareData: true,
          }
        );
        
        const response = result.data;
        // Initial load - scroll to end
        shouldScrollToEndRef.current = true;
        setChatMessages((response.data || []).map((msg): LocalChatMessage => ({ ...msg, status: 'sent' })));
        setHasMoreMessages(response.pagination?.hasMore || false);
        chatLastIdRef.current = response.pagination?.lastId || null;
        
        // If we got data from cache, fetch fresh data in background
        if (result.fromCache) {
          refreshCachedAccess<ChatMessagesResponse>(
            `chat/family/${familyId}?limit=10`,
            {},
            {
              ttl: CACHE_TTL.SHORT,
              cacheKey,
              compareData: true,
            }
          ).then((freshResult) => {
            if (freshResult.updated) {
              const freshResponse = freshResult.data;
              setChatMessages((freshResponse.data || []).map((msg): LocalChatMessage => ({ ...msg, status: 'sent' })));
              setHasMoreMessages(freshResponse.pagination?.hasMore || false);
              chatLastIdRef.current = freshResponse.pagination?.lastId || null;
            }
          }).catch(() => {
            // Silently fail background refresh
          });
        }
      }
    } catch (err: any) {
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        handleSessionExpired();
        return;
      }
    } finally {
      if (loadMore) {
        setLoadingMoreMessages(false);
      } else {
        setChatLoading(false);
      }
    }
  }, [familyId, handleSessionExpired]);

  // WebSocket connection and chat real-time
  useEffect(() => {
    let unsubscribeNewMessage: (() => void) | null = null;

    const setupSocket = async () => {
      try {
        await connectChatSocket();
        console.log('[Chat] Socket connected');

        // Listen for new messages
        unsubscribeNewMessage = onNewMessage((message) => {
          console.log('[Chat] New message received:', message);
          setChatMessages((prev) => {
            // Check if this is replacing a temporary message (sending status)
            // Use currentUserId from closure - it will be the value when effect runs
            const isOwnMessage = String(message.userId) === String(currentUserId);
            
            // First check: avoid duplicates by message ID
            if (prev.some((m) => m.id === message.id && m.id > 0)) {
              return prev;
            }
            
            if (isOwnMessage) {
              // Try to find and replace temporary message
              // Check pending temp messages first for more accurate matching
              let tempMessageIndex = -1;
              let matchedPendingEntry: { tempId: number; message: string; timestamp: number } | null = null;
              
              // Find matching pending temp message
              for (const [timestamp, pending] of pendingTempMessagesRef.current.entries()) {
                if (pending.message === message.message && pending.tempId < 0) {
                  matchedPendingEntry = pending;
                  // Find the temp message in the list
                  tempMessageIndex = prev.findIndex((m) => m.id === pending.tempId);
                  if (tempMessageIndex !== -1) {
                    break;
                  }
                }
              }
              
              // If not found via pending map, try fallback matching
              if (tempMessageIndex === -1) {
                tempMessageIndex = prev.findIndex(
                  (m) => m.status === 'sending' && 
                  m.userId === message.userId && 
                  m.message === message.message &&
                  m.id < 0 // Only match temporary messages (negative IDs)
                );
              }
              
              if (tempMessageIndex !== -1) {
                // Replace the temporary message
                const updated = [...prev];
                updated[tempMessageIndex] = {
                  id: message.id,
                  userId: message.userId,
                  title: message.title,
                  message: message.message,
                  data: message.data,
                  isRead: false,
                  familyId: message.familyId,
                  createdAt: message.createdAt,
                  status: 'sent',
                };
                
                // Clean up pending temp message if found
                if (matchedPendingEntry) {
                  for (const [timestamp, pending] of pendingTempMessagesRef.current.entries()) {
                    if (pending.tempId === matchedPendingEntry.tempId) {
                      pendingTempMessagesRef.current.delete(timestamp);
                      break;
                    }
                  }
                }
                
                return updated;
              }
            }
            
            // If not own message or no temp message found, add as new message
            // But double-check we don't already have it
            if (!prev.some((m) => m.id === message.id)) {
              return [...prev, {
                id: message.id,
                userId: message.userId,
                title: message.title,
                message: message.message,
                data: message.data,
                isRead: false,
                familyId: message.familyId,
                createdAt: message.createdAt,
                status: 'sent',
              }];
            }
            
            return prev;
          });
        });

        // Join room if chat tab is active
        if (activeTab === 'chat') {
          await joinChatRoom(familyId);
          console.log('[Chat] Joined room for family:', familyId);
        }
      } catch (err) {
        console.error('[Chat] Socket connection error:', err);
      }
    };

    setupSocket();

    return () => {
      if (unsubscribeNewMessage) {
        unsubscribeNewMessage();
      }
      leaveChatRoom(familyId);
      disconnectChatSocket();
      console.log('[Chat] Socket cleanup completed');
    };
  }, [familyId, currentUserId]);

  // Join/leave room when tab changes
  useEffect(() => {
    if (activeTab === 'chat') {
      // Reset scroll position flag when switching to chat tab
      shouldScrollToEndRef.current = true;
      fetchChatMessages();
      joinChatRoom(familyId);
    } else {
      leaveChatRoom(familyId);
    }
  }, [activeTab, familyId, fetchChatMessages]);

  // Auto-scroll to bottom when chat messages are loaded or tab is opened
  useEffect(() => {
    if (activeTab === 'chat' && chatMessages.length > 0 && !chatLoading) {
      // Use requestAnimationFrame to ensure FlatList is fully rendered
      requestAnimationFrame(() => {
        setTimeout(() => {
          chatListRef.current?.scrollToEnd({ animated: false });
        }, 100);
      });
    }
  }, [chatMessages, activeTab, chatLoading]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sendingMessage) return;

    const messageText = newMessage.trim();
    const tempId = tempMessageIdRef.current--;
    const timestamp = Date.now();
    
    // Track this temp message
    pendingTempMessagesRef.current.set(timestamp, { tempId, message: messageText, timestamp });
    
    // Add message immediately with "sending" status
    const tempMessage: LocalChatMessage = {
      id: tempId,
      userId: currentUserId!,
      title: 'Tin nhắn',
      message: messageText,
      isRead: false,
      familyId,
      createdAt: new Date().toISOString(),
      status: 'sending',
    };

    setChatMessages((prev) => [...prev, tempMessage]);
    setNewMessage('');
    
    // Scroll to bottom immediately
    shouldScrollToEndRef.current = true;
    setTimeout(() => {
      chatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    setSendingMessage(true);
    try {
      // Use WebSocket to send message (real-time)
      const result = await sendMessageWS({
        familyId,
        title: 'Tin nhắn',
        message: messageText,
      });

      if (result.success) {
        // Message will be received via onNewMessage listener and replace the temp message
        // Clean up after 5 seconds if message not received
        setTimeout(() => {
          const pending = pendingTempMessagesRef.current.get(timestamp);
          if (pending) {
            pendingTempMessagesRef.current.delete(timestamp);
            setChatMessages((prev) => {
              const tempIndex = prev.findIndex((m) => m.id === pending.tempId);
              if (tempIndex !== -1 && prev[tempIndex].status === 'sending') {
                // If still sending, update status to sent (message was sent successfully)
                const updated = [...prev];
                updated[tempIndex] = { ...updated[tempIndex], status: 'sent' };
                return updated;
              }
              return prev;
            });
          }
        }, 5000);
      } else {
        // Fallback to REST API if WebSocket fails
        try {
          const sentMessage = await sendChatMessage({
            familyId,
            title: 'Tin nhắn',
            message: messageText,
          });
          
          // Replace temp message with real one
          setChatMessages((prev) => {
            const tempIndex = prev.findIndex((m) => m.id === tempId);
            if (tempIndex !== -1) {
              const updated = [...prev];
              updated[tempIndex] = {
                ...sentMessage,
                status: 'sent',
              };
              return updated;
            }
            // If temp message not found, check if we already have this message (avoid duplicate)
            if (!prev.some((m) => m.id === sentMessage.id)) {
              return [...prev, { ...sentMessage, status: 'sent' }];
            }
            return prev;
          });
          
          // Clean up pending temp message
          for (const [ts, pending] of pendingTempMessagesRef.current.entries()) {
            if (pending.tempId === tempId) {
              pendingTempMessagesRef.current.delete(ts);
              break;
            }
          }
          
          // Invalidate chat cache when sending message via REST API
          await clearCacheByPattern(`group:family:${familyId}:chat:messages`);
        } catch (restErr) {
          // Mark as failed
          setChatMessages((prev) => {
            const tempIndex = prev.findIndex((m) => m.id === tempId);
            if (tempIndex !== -1) {
              const updated = [...prev];
              updated[tempIndex] = { ...updated[tempIndex], status: 'failed' };
              return updated;
            }
            return prev;
          });
          throw restErr;
        }
      }
    } catch (err: any) {
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        handleSessionExpired();
        return;
      }
      // Mark message as failed
      setChatMessages((prev) => {
        const tempIndex = prev.findIndex((m) => m.id === tempId);
        if (tempIndex !== -1) {
          const updated = [...prev];
          updated[tempIndex] = { ...updated[tempIndex], status: 'failed' };
          return updated;
        }
        return prev;
      });
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn. Vui lòng thử lại.');
    } finally {
      setSendingMessage(false);
    }
  };

  const formatChatTime = (dateString: string, status?: 'sending' | 'sent' | 'failed') => {
    // Show "Đang gửi..." if message is still sending
    if (status === 'sending') {
      return 'Đang gửi...';
    }
    
    // Show "Gửi thất bại" if message failed
    if (status === 'failed') {
      return 'Gửi thất bại';
    }

    // Convert to Vietnam timezone (UTC+7)
    const utcDate = new Date(dateString);
    const vietnamOffset = 7 * 60 * 60 * 1000; // 7 hours in milliseconds
    const vietnamDate = new Date(utcDate.getTime() + vietnamOffset);

    const now = new Date();
    const nowVietnam = new Date(now.getTime() + (now.getTimezoneOffset() * 60 * 1000) + vietnamOffset);

    const diffMs = nowVietnam.getTime() - vietnamDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    // Format date in Vietnam timezone
    const hours = vietnamDate.getUTCHours().toString().padStart(2, '0');
    const minutes = vietnamDate.getUTCMinutes().toString().padStart(2, '0');
    const day = vietnamDate.getUTCDate().toString().padStart(2, '0');
    const month = (vietnamDate.getUTCMonth() + 1).toString().padStart(2, '0');

    return `${hours}:${minutes} ${day}/${month}`;
  };

  const getMemberByUserId = useCallback((userId: number | string) => {
    return members.find(m => String(m.user_id) === String(userId)) || null;
  }, [members]);

  const renderChatMessage = ({ item }: { item: LocalChatMessage }) => {
    const member = getMemberByUserId(item.userId);
    // Use == for type coercion or explicitly convert to same type
    const isOwnMessage = String(item.userId) === String(currentUserId);
    const senderName = member?.user?.full_name || 'Người dùng';
    const avatarUrl = member?.user?.avatar_url;
    const role = member?.role || 'member';

    const getAvatarPlaceholderStyle = () => {
      switch (role) {
        case 'owner': return groupStyles.chatMessageAvatarPlaceholderOwner;
        case 'manager': return groupStyles.chatMessageAvatarPlaceholderManager;
        default: return groupStyles.chatMessageAvatarPlaceholderMember;
      }
    };



    // Own message: align right, no avatar header
    if (isOwnMessage) {
      return (
        <View style={[
          groupStyles.chatMessageCard,
          groupStyles.chatMessageCardOwn,
        ]}>
          {item.title && item.title !== 'Tin nhắn' && (
            <Text style={groupStyles.chatMessageTitle}>{item.title}</Text>
          )}
          <Text style={groupStyles.chatMessageContent}>{item.message}</Text>
          <Text style={[groupStyles.chatMessageTime, { textAlign: 'right', marginTop: 6 }]}>
            {formatChatTime(item.createdAt, item.status)}
          </Text>
        </View>
      );
    }

    // Other's message: align left, show avatar and info
    return (
      <View style={[
        groupStyles.chatMessageCard,
        groupStyles.chatMessageCardOther,
      ]}>
        <View style={groupStyles.chatMessageHeader}>
          <View style={groupStyles.chatMessageAvatar}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={groupStyles.chatMessageAvatarImage}
              />
            ) : (
              <View style={[
                groupStyles.chatMessageAvatarPlaceholder,
                getAvatarPlaceholderStyle(),
              ]}>
                <Text style={groupStyles.chatMessageAvatarText}>
                  {senderName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View style={groupStyles.chatMessageHeaderInfo}>
            <Text style={groupStyles.chatMessageSenderName}>
              {senderName}
            </Text>
            <Text style={groupStyles.chatMessageTime}>
              {formatChatTime(item.createdAt, item.status)}
            </Text>
          </View>
        </View>
        {item.title && item.title !== 'Tin nhắn' && (
          <Text style={groupStyles.chatMessageTitle}>{item.title}</Text>
        )}
        <Text style={groupStyles.chatMessageContent}>{item.message}</Text>
      </View>
    );
  };

  const renderChatTab = () => {
    if (chatLoading && chatMessages.length === 0) {
      return (
        <View style={groupStyles.chatLoadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={groupStyles.chatLoadingText}>Đang tải tin nhắn...</Text>
        </View>
      );
    }

    return (
      <KeyboardAvoidingView
        style={groupStyles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {chatMessages.length === 0 ? (
          <View style={groupStyles.chatEmptyState}>
            <View style={groupStyles.chatEmptyIcon}>
              <Ionicons name="chatbubbles-outline" size={40} color={COLORS.primary} />
            </View>
            <Text style={groupStyles.chatEmptyTitle}>
              Chưa có tin nhắn nào
            </Text>
            <Text style={groupStyles.chatEmptySubtitle}>
              Hãy bắt đầu cuộc trò chuyện với các thành viên trong nhóm!
            </Text>
          </View>
        ) : (
          <FlatList<LocalChatMessage>
            ref={chatListRef}
            data={[...chatMessages].sort((a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            )}
            renderItem={renderChatMessage}
            keyExtractor={(item) => `${item.id}-${item.status || 'sent'}`}
            style={groupStyles.chatMessagesList}
            contentContainerStyle={groupStyles.chatMessagesContent}
            showsVerticalScrollIndicator={false}
            inverted={false}
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 10,
            }}
            onContentSizeChange={(_, contentHeight) => {
              if (shouldScrollToEndRef.current && contentHeight > 0) {
                // Scroll to end immediately when content size changes
                requestAnimationFrame(() => {
                  chatListRef.current?.scrollToEnd({ animated: false });
                  // Reset after initial scroll
                  setTimeout(() => {
                    shouldScrollToEndRef.current = false;
                  }, 100);
                });
              }
            }}
            onScroll={(event) => {
              const { contentOffset } = event.nativeEvent;
              // Calculate distance from top
              const scrollPosition = contentOffset.y;
              // Auto load more when scroll near top (< 100px from top)
              if (scrollPosition < 100 && hasMoreMessages && !loadingMoreMessages && !chatLoading) {
                fetchChatMessages(true);
              }
            }}
            scrollEventThrottle={100}
            ListHeaderComponent={
              loadingMoreMessages ? (
                <View style={{ padding: 12, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={{ color: COLORS.grey, fontSize: 12, marginTop: 4 }}>
                    Đang tải...
                  </Text>
                </View>
              ) : null
            }
            refreshControl={
              <RefreshControl
                refreshing={chatLoading}
                onRefresh={() => fetchChatMessages(false)}
                colors={[COLORS.primary]}
                tintColor={COLORS.primary}
              />
            }
          />
        )}

        <View style={groupStyles.chatInputContainer}>
          <View style={groupStyles.chatInputWrapper}>
            <TextInput
              style={groupStyles.chatInput}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor={COLORS.grey}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={1000}
              editable={!sendingMessage}
            />
          </View>
          <TouchableOpacity
            style={[
              groupStyles.chatSendButton,
              (!newMessage.trim() || sendingMessage) && groupStyles.chatSendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || sendingMessage}
          >
            <Ionicons name="send" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  };

  // Generate date range for carousel (5 dates: 2 before, current, 2 after based on offset)
  const dateRange = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = -2; i <= 2; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + dateOffset + i);
      dates.push(date);
    }
    return dates;
  }, [dateOffset]);

  // Format date for display
  const formatDate = (date: Date) => {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const today = new Date();
    const isToday = isSameDay(date, today);

    return {
      day: date.getDate(),
      weekday: days[date.getDay()],
      isToday,
    };
  };

  // Check if two dates are the same day
  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  // Filter shopping lists by selected date and sort by creation time (newest at bottom)
  const filteredShoppingLists = useMemo(() => {
    return shoppingLists
      .filter(list => {
        const listDate = new Date(list.shopping_date);
        return isSameDay(listDate, selectedDate);
      })
      .sort((a, b) => {
        // Sort by created_at (ascending) - newest at bottom
        // For optimistic lists with negative IDs, use the absolute value for comparison
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        
        // If dates are equal, sort by ID (ascending) - higher ID (newer) at bottom
        if (dateA === dateB) {
          return a.id - b.id;
        }
        
        return dateA - dateB;
      });
  }, [shoppingLists, selectedDate]);

  // Handle create shopping list (optimistic UI)
  const handleCreateShoppingList = async () => {
    // Format date in local timezone (YYYY-MM-DD)
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // Ensure owner_id is number or undefined (not null or string)
    const ownerId = assignedOwner ? Number(assignedOwner.user_id) : undefined;

    // Close modal immediately for better UX
    setShowAddListModal(false);
    setAssignedOwner(null);
    setShowAssignMemberDropdown(false);

    // Create optimistic shopping list (temporary ID will be negative)
    const tempId = Date.now() * -1; // Use negative timestamp as temporary ID
    
    // Determine owner info for optimistic list
    let ownerInfo: ShoppingList['owner'] = undefined;
    if (assignedOwner) {
      ownerInfo = {
        id: assignedOwner.user_id,
        full_name: assignedOwner.user.full_name,
        email: assignedOwner.user.email,
        avatar_url: assignedOwner.user.avatar_url,
      };
    } else if (currentMember) {
      // Use current user info when no owner is assigned
      ownerInfo = {
        id: currentMember.user_id,
        full_name: currentMember.user.full_name,
        email: currentMember.user.email,
        avatar_url: currentMember.user.avatar_url,
      };
    }
    
    const optimisticList: ShoppingList = {
      id: tempId,
      owner_id: ownerId || currentUserId || 0,
      family_id: familyId,
      cost: 0,
      is_shared: true,
      shopping_date: dateStr,
      created_at: new Date().toISOString(),
      items: [],
      owner: ownerInfo,
    };

    // Add optimistic list to state immediately
    setShoppingLists(prevLists => [...prevLists, optimisticList]);

    // Make API call in background
    try {
      await createShoppingList(familyId, dateStr, ownerId);
      
      // Invalidate cache when creating shopping list
      await clearCacheByPattern(`group:family:${familyId}:shopping-lists`);
      
      // Fetch fresh data from API to ensure consistency
      await fetchShoppingLists(true);
    } catch (error) {
      // Remove optimistic list on error
      setShoppingLists(prevLists => 
        prevLists.filter(list => list.id !== tempId)
      );
      
      // Show error notification
      Alert.alert('Lỗi', 'Không thể tạo danh sách mua sắm. Vui lòng thử lại.');
    }
  };

  // Handle delete shopping list (optimized with optimistic update)
  const handleDeleteShoppingList = async (listId: number) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc muốn xóa danh sách mua sắm này? Tất cả mặt hàng trong danh sách cũng sẽ bị xóa.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            // Store deleted list for rollback
            let deletedList: ShoppingList | null = null;

            // Optimistic update: Remove list immediately
            setShoppingLists(prevLists => {
              const listToDelete = prevLists.find(l => l.id === listId);
              if (listToDelete) {
                deletedList = { ...listToDelete };
              }
              return prevLists.filter(l => l.id !== listId);
            });

            try {
              await deleteShoppingList(listId);
              
              // Invalidate cache when deleting shopping list
              await clearCacheByPattern(`group:family:${familyId}:shopping-lists`);
              
              // Only fetch shopping lists (much faster)
              await fetchShoppingLists(true);
              Alert.alert('Thành công', 'Đã xóa danh sách mua sắm');
            } catch (error) {
              // Rollback on error
              if (deletedList) {
                setShoppingLists(prevLists => [...prevLists, deletedList!]);
              }
              await fetchShoppingLists();
              Alert.alert('Lỗi', 'Không thể xóa danh sách mua sắm');
            }
          },
        },
      ]
    );
  };

  // Search ingredients
  const handleSearchIngredients = async (searchText: string) => {
    setIngredientSearchTerm(searchText);

    if (searchText.trim().length < 2) {
      setSearchedIngredients([]);
      return;
    }

    try {
      setLoadingIngredients(true);
      const response = await searchIngredients({
        name: searchText,
        limit: 20,
      });

      if (response && response.data) {
        setSearchedIngredients(response.data);
      } else {
        setSearchedIngredients([]);
      }
    } catch (error) {
      setSearchedIngredients([]);
    } finally {
      setLoadingIngredients(false);
    }
  };

  // Select ingredient
  const handleSelectIngredient = (ingredient: any) => {
    setSelectedIngredient(ingredient);
    // Ensure ingredient ID is a number
    setNewItemIngredientId(Number(ingredient.id));
    setIngredientSearchTerm('');
    setSearchedIngredients([]);

    // Calculate price based on current stock
    if (ingredient.price) {
      const stock = parseInt(newItemStock) || 500;
      const calculatedPrice = (ingredient.price * stock / 1000).toFixed(0);
      setNewItemPrice(calculatedPrice);
    }
  };

  // Update price when stock changes
  useEffect(() => {
    if (selectedIngredient && selectedIngredient.price && newItemStock) {
      const stock = parseInt(newItemStock);
      if (!isNaN(stock) && stock > 0) {
        const calculatedPrice = (selectedIngredient.price * stock / 1000).toFixed(0);
        setNewItemPrice(calculatedPrice);
      }
    }
  }, [newItemStock, selectedIngredient]);

  // Handle add item to list (optimistic UI)
  const handleAddItem = async () => {
    if (!selectedListId || !newItemIngredientId || !newItemStock || !selectedIngredient) {
      Alert.alert('Lỗi', 'Vui lòng chọn nguyên liệu và nhập số lượng');
      return;
    }

    // Store values before resetting form
    const listId = Number(selectedListId);
    const ingredientId = Number(newItemIngredientId);
    const stock = parseInt(newItemStock);
    // Backend expects price per kg, not total price
    const price = selectedIngredient?.price ? Number(selectedIngredient.price) : undefined;
    const ingredient = selectedIngredient;

    // Validate numbers
    if (isNaN(listId) || isNaN(ingredientId) || isNaN(stock)) {
      Alert.alert('Lỗi', 'Dữ liệu không hợp lệ');
      return;
    }

    // Store original cost for rollback
    let originalCost = 0;
    const targetList = shoppingLists.find(list => Number(list.id) === Number(listId));
    if (targetList) {
      originalCost = targetList.cost;
    }

    // Create optimistic item with temporary negative ID
    const tempId = Date.now() * -1;
    
    // Calculate item cost: use newItemPrice (total price) if available, otherwise calculate from price per kg
    let itemCost = 0;
    if (newItemPrice && newItemPrice.trim() !== '') {
      // Use the total price entered by user (remove any formatting, parse as number)
      const cleanPrice = newItemPrice.replace(/[^\d.]/g, '');
      itemCost = parseFloat(cleanPrice) || 0;
    } else {
      // Calculate from price per kg and stock
      itemCost = (price || ingredient.price || 0) * stock / 1000;
    }
    
    // Round to avoid floating point issues
    itemCost = Math.round(itemCost);
    const optimisticItem: ShoppingItem = {
      id: tempId,
      list_id: listId,
      ingredient_id: ingredientId,
      stock: stock,
      price: price || ingredient.price || 0,
      is_checked: false,
      created_at: new Date().toISOString(),
      ingredient: {
        id: ingredient.id,
        name: ingredient.name,
        image_url: ingredient.image_url || null,
        price: ingredient.price || null,
        description: ingredient.description || null,
      },
    };

    // Update local state IMMEDIATELY before closing modal (optimistic update)
    // This ensures cost updates instantly, just like delete does
    // Force immediate update by using functional setState with explicit calculation
    setShoppingLists(prevLists => {
      const updatedLists = prevLists.map(list => {
        if (Number(list.id) === Number(listId)) {
          const currentCost = Number(list.cost) || 0;
          const newCost = Math.round(currentCost + itemCost);
          
          // Return new object to force re-render
          return {
            ...list,
            items: [...(list.items || []), optimisticItem],
            cost: newCost,
          };
        }
        return list;
      });
      
      // Return new array reference to force React to re-render
      return updatedLists;
    });

    // Close modal immediately for better UX
    setShowAddItemModal(false);

    // Reset form immediately
    setSelectedListId(null);
    setNewItemIngredientId(null);
    setSelectedIngredient(null);
    setNewItemStock('500');
    setNewItemPrice('');
    setIngredientSearchTerm('');
    setSearchedIngredients([]);

    // Call API in background (don't await to keep UI responsive)
    addItemToList(listId, ingredientId, stock, price)
      .then((newItem) => {
        // Invalidate cache when adding item
        clearCacheByPattern(`group:family:${familyId}:shopping-lists`).catch(() => {});
        
        // Update optimistic item with real ID from server, but PRESERVE optimistic cost
        // Don't let server data overwrite the cost that user just saw
        if (newItem) {
          setShoppingLists(prevLists =>
            prevLists.map(list => {
              if (Number(list.id) === Number(listId)) {
                // Get current optimistic cost before updating
                const optimisticCost = list.cost;
                
                return {
                  ...list,
                  items: list.items.map(item => 
                    item.id === tempId 
                      ? { ...newItem, ingredient: optimisticItem.ingredient }
                      : item
                  ),
                  // CRITICAL: Keep the optimistic cost - don't let server overwrite it
                  cost: optimisticCost,
                };
              }
              return list;
            })
          );
        }
        
        // Don't fetch all lists immediately - it would overwrite optimistic cost
        // Only sync with server after a long delay, and only if user hasn't interacted
        // The optimistic cost is already correct, server will sync eventually
        setTimeout(() => {
          // Silently sync in background without overwriting optimistic cost
          refreshCachedAccess<ShoppingList[]>(
            `shopping-lists/my-family-shared/${familyId}`,
            {},
            {
              ttl: CACHE_TTL.MEDIUM,
              cacheKey: `group:family:${familyId}:shopping-lists`,
              compareData: true,
            }
          ).then((result) => {
            const serverData = Array.isArray(result.data) ? result.data : [];
            
            // Merge: update items from server but preserve optimistic cost
            setShoppingLists(prevLists => {
              return prevLists.map(list => {
                if (Number(list.id) === Number(listId)) {
                  const serverList = serverData.find(sl => Number(sl.id) === Number(listId));
                  if (serverList) {
                    // Merge server items but keep optimistic cost
                    return {
                      ...serverList,
                      cost: list.cost, // Preserve optimistic cost
                      items: serverList.items || list.items,
                    };
                  }
                  return list;
                }
                // For other lists, use server data
                const serverList = serverData.find(sl => Number(sl.id) === Number(list.id));
                return serverList || list;
              });
            });
          }).catch(() => {
            // Silently fail, optimistic update is already shown
          });
        }, 5000); // Long delay to ensure user sees immediate update
      })
      .catch((error) => {
        // Rollback optimistic update on error
        setShoppingLists(prevLists =>
          prevLists.map(list =>
            Number(list.id) === Number(listId)
              ? {
                  ...list,
                  items: list.items.filter(item => item.id !== tempId),
                  cost: originalCost,
                }
              : list
          )
        );
        
        // Show error notification
        Alert.alert('Lỗi', 'Không thể thêm mặt hàng. Vui lòng thử lại.');
      });
  };

  // Handle toggle item checked (optimized with optimistic update)
  const handleToggleItem = async (itemId: number) => {
    // Optimistic update: Toggle immediately
    let previousState: boolean = false;
    setShoppingLists(prevLists =>
      prevLists.map(list => ({
        ...list,
        items: list.items?.map(item => {
          if (item.id === itemId) {
            previousState = item.is_checked;
            return { ...item, is_checked: !item.is_checked };
          }
          return item;
        }) || [],
      }))
    );

    try {
      await toggleItemChecked(itemId);
      
      // Invalidate cache when toggling item
      await clearCacheByPattern(`group:family:${familyId}:shopping-lists`);
      
      // Only fetch shopping lists (much faster)
      await fetchShoppingLists(true);
    } catch (error) {
      // Rollback on error
      await fetchShoppingLists();
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
    }
  };

  // Handle delete item (optimized with optimistic update)
  const handleDeleteItem = async (itemId: number) => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc muốn xóa mặt hàng này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            // Find the item to delete for rollback
            let deletedItem: ShoppingItem | null = null;
            let listId: number | null = null;

            // Optimistic update: Remove item immediately
            setShoppingLists(prevLists =>
              prevLists.map(list => {
                const item = list.items?.find(i => i.id === itemId);
                if (item) {
                  deletedItem = item;
                  listId = list.id;
                  const itemCost = (item.price || 0) * item.stock / 1000;
                  return {
                    ...list,
                    items: list.items?.filter(i => i.id !== itemId) || [],
                    cost: Math.round((list.cost || 0) - itemCost),
                  };
                }
                return list;
              })
            );

            try {
              await deleteShoppingItem(itemId);
              
              // Invalidate cache when deleting item
              await clearCacheByPattern(`group:family:${familyId}:shopping-lists`);
              
              // Only fetch shopping lists (much faster)
              await fetchShoppingLists(true);
            } catch (error) {
              // Rollback on error
              if (deletedItem && listId) {
                setShoppingLists(prevLists =>
                  prevLists.map(list =>
                    list.id === listId
                      ? {
                        ...list,
                        items: [...(list.items || []), deletedItem!],
                        cost: list.cost + ((deletedItem!.price || 0) * deletedItem!.stock / 1000),
                      }
                      : list
                  )
                );
              }
              await fetchShoppingLists();
              Alert.alert('Lỗi', 'Không thể xóa mặt hàng');
            }
          },
        },
      ]
    );
  };

  // Handle edit item (optimistic UI)
  const handleEditItem = async () => {
    if (!editingItem || !editItemStock) {
      Alert.alert('Lỗi', 'Vui lòng nhập số lượng');
      return;
    }

    const itemId = editingItem.id;
    const stock = parseInt(editItemStock);
    const price = editingItem.ingredient?.price ? Number(editingItem.ingredient.price) : undefined;

    // Validate numbers
    if (isNaN(stock) || stock <= 0) {
      Alert.alert('Lỗi', 'Số lượng không hợp lệ');
      return;
    }

    // Store original values for rollback
    let originalItem: ShoppingItem | null = null;
    let originalCost = 0;
    let listId: number | null = null;

    const targetList = shoppingLists.find(list => 
      list.items?.some(item => item.id === itemId)
    );
    if (targetList) {
      const item = targetList.items?.find(item => item.id === itemId);
      if (item) {
        originalItem = { ...item };
        originalCost = targetList.cost;
        listId = targetList.id;
      }
    }

    if (!originalItem || !listId) {
      Alert.alert('Lỗi', 'Không tìm thấy mặt hàng');
      return;
    }

    // Calculate old and new costs
    const oldItemCost = (originalItem.price || 0) * originalItem.stock / 1000;
    const newItemCost = (price || 0) * stock / 1000;
    const costDifference = newItemCost - oldItemCost;

    // Close modal immediately
    setShowEditItemModal(false);

    // Optimistic update: Update item immediately
    setShoppingLists(prevLists =>
      prevLists.map(list =>
        Number(list.id) === Number(listId)
          ? {
            ...list,
            items: list.items.map(item =>
              item.id === itemId
                ? {
                  ...item,
                  stock: stock,
                  price: price || item.price || 0,
                }
                : item
            ),
            cost: list.cost + costDifference,
          }
          : list
      )
    );

    // Reset form
    setEditingItem(null);
    setEditItemStock('');
    setEditItemPrice('');

    // Call API in background
    try {
      await updateShoppingItem(itemId, {
        stock: stock,
        price: price,
      });
      
      // Invalidate cache when updating item
      await clearCacheByPattern(`group:family:${familyId}:shopping-lists`);
      
      // Fetch fresh data from API to ensure consistency
      await fetchShoppingLists(true);
    } catch (error) {
      // Rollback optimistic update on error
      if (originalItem && listId) {
        setShoppingLists(prevLists =>
          prevLists.map(list =>
            Number(list.id) === Number(listId)
              ? {
                ...list,
                items: list.items.map(item =>
                  item.id === itemId ? originalItem! : item
                ),
                cost: originalCost,
              }
              : list
          )
        );
      }
      
      // Show error notification
      Alert.alert('Lỗi', 'Không thể cập nhật mặt hàng. Vui lòng thử lại.');
    }
  };

  // Filter members based on search term
  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) {
      return members;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    return members.filter(member =>
      member.user.full_name?.toLowerCase().includes(lowerSearchTerm) ||
      member.user.email?.toLowerCase().includes(lowerSearchTerm)
    );
  }, [members, searchTerm]);

  const renderMembersList = () => {
    if (!members || members.length === 0) {
      return (
        <View style={groupStyles.emptyState}>
          <Ionicons name='people-outline' size={48} color={COLORS.grey} />
          <Text style={groupStyles.emptyStateText}>
            Chưa có thành viên nào
          </Text>
        </View>
      );
    }

    if (filteredMembers.length === 0) {
      return (
        <View style={groupStyles.emptyState}>
          <Ionicons name='people-outline' size={48} color={COLORS.grey} />
          <Text style={groupStyles.emptyStateText}>
            {searchTerm ? 'Không tìm thấy thành viên nào' : 'Chưa có thành viên nào'}
          </Text>
        </View>
      );
    }

    return (
      <View style={groupStyles.membersList}>
        {filteredMembers.map((member, index) => {
          // Sử dụng unique key - nếu member.id = 0 (owner), dùng user_id
          const memberKey = member.id === 0 ? `owner-${member.user_id}-${index}` : `member-${member.id}`;
          return (
            <TouchableOpacity
              key={memberKey}
              style={groupStyles.memberCard}
              onPress={() => handleMemberMenu(member)}
              activeOpacity={0.7}
            >
              <View style={groupStyles.memberAvatar}>
                {member.user.avatar_url ? (
                  <Image
                    source={{ uri: member.user.avatar_url }}
                    style={groupStyles.memberAvatarImage}
                  />
                ) : (
                  <View style={groupStyles.memberAvatarPlaceholder}>
                    <Text style={groupStyles.memberAvatarText}>
                      {member.user.full_name?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}
              </View>

              <View style={groupStyles.memberInfo}>
                <Text style={groupStyles.memberName}>
                  {member.user.full_name || 'Người dùng'}
                </Text>
                <Text style={groupStyles.memberEmail}>{member.user.email}</Text>
              </View>

              <View style={[
                groupStyles.roleBadge,
                member.role === 'owner' ? groupStyles.roleBadgeOwner :
                  member.role === 'manager' ? groupStyles.roleBadgeManager : groupStyles.roleBadgeMember
              ]}>
                <Text style={[
                  groupStyles.roleText,
                  member.role === 'owner' ? groupStyles.roleTextOwner :
                    member.role === 'manager' ? groupStyles.roleTextManager : groupStyles.roleTextMember
                ]}>
                  {member.role === 'owner' ? 'Chủ nhóm' :
                    member.role === 'manager' ? 'Quản lý' : 'Thành viên'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const handlePreviousDate = () => {
    setDateOffset(prev => prev - 1);
  };

  const handleNextDate = () => {
    setDateOffset(prev => prev + 1);
  };

  const renderDateCarousel = () => {
    return (
      <View style={groupStyles.dateCarouselContainer}>
        <TouchableOpacity
          style={groupStyles.dateNavButton}
          onPress={handlePreviousDate}
        >
          <Ionicons name="chevron-back" size={20} color={COLORS.darkGrey} />
        </TouchableOpacity>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={groupStyles.dateCarousel}
        >
          {dateRange.map((date, index) => {
            const { day, weekday, isToday } = formatDate(date);
            const isActive = isSameDay(date, selectedDate);

            return (
              <TouchableOpacity
                key={index}
                style={[
                  groupStyles.dateItem,
                  isActive && groupStyles.dateItemActive,
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[
                  groupStyles.dateWeekday,
                  isActive && groupStyles.dateWeekdayActive,
                ]}>
                  {isToday ? 'Hôm nay' : weekday}
                </Text>
                <Text style={[
                  groupStyles.dateDay,
                  isActive && groupStyles.dateDayActive,
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          style={groupStyles.dateNavButton}
          onPress={handleNextDate}
        >
          <Ionicons name="chevron-forward" size={20} color={COLORS.darkGrey} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderShoppingItem = (item: ShoppingItem, list: ShoppingList) => {
    return (
      <View
        key={item.id}
        style={[groupStyles.shoppingItemRow, { flexDirection: 'row', alignItems: 'center' }]}
      >
        <TouchableOpacity
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}
          onPress={() => handleToggleItem(item.id)}
        >
          <TouchableOpacity
            style={[
              groupStyles.checkbox,
              item.is_checked && groupStyles.checkboxChecked,
            ]}
            onPress={() => handleToggleItem(item.id)}
          >
            {item.is_checked && (
              <Ionicons name="checkmark" size={16} color={COLORS.white} />
            )}
          </TouchableOpacity>

          {item.ingredient?.image_url ? (
            <Image
              source={{ uri: item.ingredient.image_url }}
              style={groupStyles.itemImage}
            />
          ) : (
            <View style={groupStyles.itemImage}>
              <Ionicons name="fast-food-outline" size={24} color={COLORS.grey} />
            </View>
          )}

          <View style={[groupStyles.itemInfo, { flex: 1, marginRight: 2 }]}>
            <Text style={[
              groupStyles.itemName,
              item.is_checked && groupStyles.itemNameChecked,
            ]}>
              {item.ingredient?.name || 'Nguyên liệu'}
            </Text>
            <Text style={groupStyles.itemDetails}>
              Số lượng: {item.stock}g
            </Text>
          </View>
        </TouchableOpacity>

        {/* Edit and Delete buttons */}
        <View style={{ flexDirection: 'row', gap: 0, alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => {
              setEditingItem(item);
              setEditItemStock(item.stock.toString());
              setEditItemPrice(item.ingredient?.price ? ((item.ingredient.price * item.stock) / 1000).toString() : '');
              setShowEditItemModal(true);
            }}
            style={{ padding: 8 }}
          >
            <Ionicons name="create-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteItem(item.id)}
            style={{ padding: 8 }}
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.red} />
          </TouchableOpacity>
          
          {/* Price - outside right */}
          <Text style={[groupStyles.itemQuantity, { marginLeft: 4 }]}>
            {formatCurrency((item.price || 0) * item.stock / 1000)}
          </Text>
        </View>
      </View>
    );
  };

  const renderShoppingList = () => {
    return (
      <>
        {renderDateCarousel()}

        <View style={groupStyles.shoppingListsContainer}>
          {filteredShoppingLists.length === 0 ? (
            <View style={groupStyles.emptyState}>
              <Ionicons name='cart-outline' size={48} color={COLORS.grey} />
              <Text style={groupStyles.emptyStateText}>
                Danh sách cho ngày này trống.
              </Text>
              <Text style={groupStyles.emptyShoppingText}>
                Nhấn + để thêm mặt hàng mới!
              </Text>
            </View>
          ) : (
            filteredShoppingLists.map(list => (
              <View key={list.id} style={groupStyles.shoppingListCard}>
                <View style={groupStyles.shoppingListHeader}>
                  <View>
                    <Text style={groupStyles.shoppingListTitle}>
                      Danh sách mua sắm
                    </Text>
                    {list.owner && (
                      <View style={groupStyles.ownerInfo}>
                        <View style={groupStyles.ownerAvatar}>
                          {list.owner.avatar_url ? (
                            <Image
                              source={{ uri: list.owner.avatar_url }}
                              style={groupStyles.ownerAvatarImage}
                            />
                          ) : (
                            <Image
                              source={defaultAvatar}
                              style={groupStyles.ownerAvatarImage}
                            />
                          )}
                        </View>
                        <Text style={groupStyles.ownerName}>
                          {list.owner.full_name}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={groupStyles.shoppingListCost}>
                    {formatCurrency(list.cost)}
                  </Text>
                </View>

                <View style={groupStyles.shoppingItemsContainer}>
                  {list.items && list.items.length > 0 ? (
                    // Sort items: oldest first (top), newest last (bottom)
                    [...list.items]
                      .sort((a, b) => {
                        const dateA = new Date(a.created_at || 0).getTime();
                        const dateB = new Date(b.created_at || 0).getTime();
                        return dateA - dateB; // Ascending: older items first
                      })
                      .map(item => renderShoppingItem(item, list))
                  ) : (
                    <Text style={groupStyles.emptyShoppingText}>
                      Chưa có mặt hàng nào
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={groupStyles.addItemButton}
                  onPress={() => {
                    setSelectedListId(list.id);
                    setShowAddItemModal(true);
                  }}
                >
                  <Ionicons name="add" size={20} color={COLORS.primary} />
                  <Text style={groupStyles.addItemButtonText}>
                    Thêm mặt hàng
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={groupStyles.deleteListButton}
                  onPress={() => handleDeleteShoppingList(list.id)}
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.red} />
                  <Text style={groupStyles.deleteListButtonText}>
                    Xóa danh sách
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </>
    );
  };

  return (
    <View style={groupStyles.container}>
      <StatusBar barStyle='dark-content' backgroundColor='#FFFFFF' />

      {/* Header */}
      <View style={groupStyles.header}>
        <TouchableOpacity onPress={handleBack} style={groupStyles.headerIcon}>
          <Ionicons name='arrow-back' size={24} color={COLORS.darkGrey} />
        </TouchableOpacity>

        <Text style={groupStyles.headerTitle}>
          {family?.name || 'Chi tiết nhóm'}
        </Text>

        <TouchableOpacity
          onPress={handleMenu}
          style={groupStyles.headerIcon}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={24}
            color={COLORS.darkGrey}
          />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={groupStyles.tabContainer}
        style={{ flexGrow: 0 }}
      >
        <TouchableOpacity
          style={[
            groupStyles.tab,
            activeTab === 'shopping' && groupStyles.tabActive
          ]}
          onPress={() => setActiveTab('shopping')}
        >
          <Text style={[
            groupStyles.tabText,
            activeTab === 'shopping' && groupStyles.tabTextActive
          ]}>
            Danh sách mua sắm
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            groupStyles.tab,
            activeTab === 'chat' && groupStyles.tabActive
          ]}
          onPress={() => setActiveTab('chat')}
        >
          <Text style={[
            groupStyles.tabText,
            activeTab === 'chat' && groupStyles.tabTextActive
          ]}>
            Trò chuyện
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            groupStyles.tab,
            activeTab === 'statistics' && groupStyles.tabActive
          ]}
          onPress={() => setActiveTab('statistics')}
        >
          <Text style={[
            groupStyles.tabText,
            activeTab === 'statistics' && groupStyles.tabTextActive
          ]}>
            Thống kê
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Content */}
      {loading ? (
        <View style={groupStyles.loadingContainer}>
          <ActivityIndicator size='large' color={COLORS.primary} />
          <Text style={groupStyles.loadingText}>Đang tải...</Text>
        </View>
      ) : activeTab === 'chat' ? (
        // Chat tab has its own FlatList and KeyboardAvoidingView
        renderChatTab()
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
                onPress={() => fetchFamilyData()}
              >
                <Text style={groupStyles.retryButtonText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {activeTab === 'shopping' && renderShoppingList()}
              {activeTab === 'statistics' && <GroupStatistics familyId={familyId} />}
            </>
          )}
        </ScrollView>
      )}

      {/* FAB Button - Only show in shopping tab */}
      {activeTab === 'shopping' && !loading && (
        <TouchableOpacity
          style={groupStyles.fabButton}
          onPress={() => {
            setShowAddListModal(true);
          }}
        >
          <Ionicons name="add" size={28} color={COLORS.white} />
        </TouchableOpacity>
      )}

      {/* Family Menu */}
      <ActionMenu
        visible={showFamilyMenu}
        onClose={() => setShowFamilyMenu(false)}
        title={family?.name || 'Gia đình'}
        options={getFamilyMenuOptions()}
      />

      {/* Member Menu */}
      <ActionMenu
        visible={showMemberMenu}
        onClose={() => {
          setShowMemberMenu(false);
          setSelectedMember(null);
        }}
        title={selectedMember?.user?.full_name || 'Thành viên'}
        options={getMemberMenuOptions()}
      />

      {/* Invitation Modal */}
      {family && (
        <InvitationModal
          visible={showInvitationModal}
          onClose={() => setShowInvitationModal(false)}
          familyId={family.id}
          familyName={family.name}
          onFetchInvitation={async (id: number) => {
            const response = await getFamilyInvitationCode(id);
            // Handle both direct object and wrapped response
            return response?.data || response;
          }}
        />
      )}

      {/* Member Profile Modal */}
      <Modal
        visible={showMemberProfileModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowMemberProfileModal(false);
          setMemberProfile(null);
        }}
      >
        <View style={groupStyles.modalOverlay}>
          <View style={[groupStyles.modalContent, { maxHeight: '90%' }]}>
            <View style={groupStyles.modalHeader}>
              <Text style={groupStyles.modalTitle}>Thông tin thành viên</Text>
              <TouchableOpacity
                style={groupStyles.modalCloseButton}
                onPress={() => {
                  setShowMemberProfileModal(false);
                  setMemberProfile(null);
                }}
              >
                <Ionicons name="close" size={24} color={COLORS.darkGrey} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: '80%' }}
              showsVerticalScrollIndicator={false}
            >
              {loadingMemberProfile ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={{ marginTop: 12, color: COLORS.grey }}>Đang tải thông tin...</Text>
                </View>
              ) : memberProfile ? (
                <>
                  {/* Profile Card */}
                  <View style={{
                    backgroundColor: COLORS.white,
                    borderRadius: 20,
                    padding: 24,
                    alignItems: 'center',
                    marginBottom: 20,
                    shadowColor: '#000',
                    shadowOpacity: 0.05,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 2,
                  }}>
                    {memberProfile.avatar_url ? (
                      <Image
                        source={{ uri: memberProfile.avatar_url }}
                        style={{
                          width: 96,
                          height: 96,
                          borderRadius: 48,
                          marginBottom: 16,
                        }}
                      />
                    ) : (
                      <View style={{
                        width: 96,
                        height: 96,
                        borderRadius: 48,
                        backgroundColor: COLORS.purple,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 16,
                      }}>
                        <Text style={{
                          fontSize: 36,
                          fontWeight: '600',
                          color: COLORS.white,
                        }}>
                          {(memberProfile.fullname || memberProfile.full_name || 'U').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text style={{
                      fontSize: 22,
                      fontWeight: '700',
                      color: COLORS.darkGrey,
                    }}>
                      {memberProfile.fullname || memberProfile.full_name || 'Không có tên'}
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: COLORS.grey,
                      marginTop: 4,
                    }}>
                      {memberProfile.email}
                    </Text>
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: COLORS.purple,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 999,
                      marginTop: 12,
                      gap: 6,
                    }}>
                      <Ionicons name="shield-checkmark" size={16} color={COLORS.white} />
                      <Text style={{
                        color: COLORS.white,
                        fontWeight: '600',
                        textTransform: 'capitalize',
                      }}>
                        {memberProfile.role || 'user'}
                      </Text>
                    </View>
                  </View>

                  {/* Contact Information */}
                  <View style={{
                    backgroundColor: COLORS.white,
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 16,
                    shadowColor: '#000',
                    shadowOpacity: 0.04,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 1,
                  }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: COLORS.darkGrey,
                      marginBottom: 12,
                    }}>
                      Thông tin liên hệ
                    </Text>
                    <InfoRow icon="mail-outline" label="Email" value={memberProfile.email || 'Chưa cập nhật'} />
                    <InfoRow icon="call-outline" label="Số điện thoại" value={memberProfile.phone || 'Chưa cập nhật'} />
                    <InfoRow icon="location-outline" label="Địa chỉ" value={memberProfile.address || 'Chưa cập nhật'} />
                  </View>

                  {/* Activity */}
                  <View style={{
                    backgroundColor: COLORS.white,
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 16,
                    shadowColor: '#000',
                    shadowOpacity: 0.04,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 1,
                  }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: COLORS.darkGrey,
                      marginBottom: 12,
                    }}>
                      Hoạt động
                    </Text>
                    <InfoRow
                      icon="calendar-outline"
                      label="Ngày tạo"
                      value={memberProfile.created_at ? new Date(memberProfile.created_at).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      }) : 'Chưa cập nhật'}
                    />
                    <InfoRow
                      icon="time-outline"
                      label="Cập nhật gần nhất"
                      value={memberProfile.updated_at ? new Date(memberProfile.updated_at).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      }) : 'Chưa cập nhật'}
                    />
                  </View>
                </>
              ) : (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Ionicons name="alert-circle-outline" size={48} color={COLORS.grey} />
                  <Text style={{ marginTop: 12, color: COLORS.grey }}>Không có thông tin</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Members List Modal */}
      <Modal
        visible={showMembersView}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMembersView(false)}
      >
        <View style={groupStyles.modalOverlay}>
          {(() => {
            const screenHeight = Dimensions.get('window').height;
            const modalMaxHeight = screenHeight * 0.85;
            // Tính toán chiều cao cho ScrollView: modalMaxHeight - header - memberCount - searchBar - padding
            const headerHeight = 60; // modalHeader + marginBottom
            const memberCountHeight = 40; // memberCountContainer
            const searchBarHeight = 48; // searchContainer
            const padding = 48; // padding top + bottom của modalContent
            const scrollViewMaxHeight = modalMaxHeight - headerHeight - memberCountHeight - searchBarHeight - padding;

            return (
              <View style={[groupStyles.modalContent, {
                maxHeight: modalMaxHeight,
                width: '95%',
                height: modalMaxHeight,
              }]}>
                <View style={groupStyles.modalHeader}>
                  <Text style={groupStyles.modalTitle}>Thành viên nhóm</Text>
                  <TouchableOpacity
                    style={groupStyles.modalCloseButton}
                    onPress={() => setShowMembersView(false)}
                  >
                    <Ionicons name="close" size={24} color={COLORS.darkGrey} />
                  </TouchableOpacity>
                </View>

                {/* Member count */}
                <View style={groupStyles.memberCountContainer}>
                  <Text style={groupStyles.memberCountText}>
                    {members.length} thành viên
                  </Text>
                </View>

                {/* Search bar */}
                <View style={groupStyles.searchContainer}>
                  <Ionicons name='search' size={20} color={COLORS.grey} style={groupStyles.searchIcon} />
                  <TextInput
                    style={groupStyles.searchInput}
                    placeholder='Tìm thành viên theo tên'
                    placeholderTextColor={COLORS.grey}
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                  />
                  {searchTerm.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchTerm('')}>
                      <Ionicons name='close-circle' size={20} color={COLORS.grey} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Scrollable members list */}
                <ScrollView
                  style={{ maxHeight: scrollViewMaxHeight }}
                  contentContainerStyle={{ paddingBottom: 20 }}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                  bounces={true}
                >
                  {renderMembersList()}
                </ScrollView>
              </View>
            );
          })()}
        </View>
      </Modal>

      {/* Add Shopping List Modal */}
      <Modal
        visible={showAddListModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowAddListModal(false);
          setAssignedOwner(null);
          setShowAssignMemberDropdown(false);
        }}
      >
        <TouchableOpacity
          style={groupStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowAddListModal(false);
            setAssignedOwner(null);
            setShowAssignMemberDropdown(false);
          }}
        >
          <TouchableOpacity
            style={groupStyles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={groupStyles.modalHeader}>
              <Text style={groupStyles.modalTitle}>Tạo danh sách mua sắm</Text>
              <TouchableOpacity
                style={groupStyles.modalCloseButton}
                onPress={() => {
                  setShowAddListModal(false);
                  setAssignedOwner(null);
                  setShowAssignMemberDropdown(false);
                }}
              >
                <Ionicons name="close" size={24} color={COLORS.darkGrey} />
              </TouchableOpacity>
            </View>

            <View style={groupStyles.modalBody}>
              <Text style={groupStyles.itemDetails}>
                Tạo danh sách mua sắm mới cho ngày{' '}
                {formatDate(selectedDate).day}/{selectedDate.getMonth() + 1}
              </Text>

              {/* Assign Owner - Only for managers */}
              {family && isManager ? (
                <View style={groupStyles.assignMemberContainer}>
                  <Text style={groupStyles.assignMemberLabel}>
                    Giao nhiệm vụ cho (tùy chọn)
                  </Text>

                  {!assignedOwner ? (
                    <TouchableOpacity
                      style={groupStyles.memberSelectButton}
                      onPress={() => setShowAssignMemberDropdown(!showAssignMemberDropdown)}
                    >
                      <Text style={groupStyles.memberSelectPlaceholder}>
                        Chọn thành viên
                      </Text>
                      <Ionicons
                        name={showAssignMemberDropdown ? "chevron-up" : "chevron-down"}
                        size={20}
                        color={COLORS.grey}
                      />
                    </TouchableOpacity>
                  ) : (
                    <View style={groupStyles.selectedMemberCard}>
                      <View style={groupStyles.selectedMemberAvatar}>
                        {assignedOwner.user.avatar_url ? (
                          <Image
                            source={{ uri: assignedOwner.user.avatar_url }}
                            style={{ width: 32, height: 32, borderRadius: 16 }}
                          />
                        ) : (
                          <Text style={groupStyles.selectedMemberAvatarText}>
                            {assignedOwner.user.full_name?.charAt(0).toUpperCase() || 'U'}
                          </Text>
                        )}
                      </View>
                      <View style={groupStyles.selectedMemberInfo}>
                        <Text style={groupStyles.selectedMemberName}>
                          {assignedOwner.user.full_name}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => setAssignedOwner(null)}>
                        <Ionicons name="close-circle" size={20} color={COLORS.grey} />
                      </TouchableOpacity>
                    </View>
                  )}

                  {showAssignMemberDropdown && !assignedOwner && (
                    <ScrollView style={groupStyles.memberDropdown}>
                      {members.map((member, index) => (
                        <TouchableOpacity
                          key={member.id}
                          style={[
                            groupStyles.memberDropdownItem,
                            index === members.length - 1 && groupStyles.memberDropdownItemLast,
                          ]}
                          onPress={() => {
                            setAssignedOwner(member);
                            setShowAssignMemberDropdown(false);
                          }}
                        >
                          <View style={groupStyles.memberDropdownAvatar}>
                            {member.user.avatar_url ? (
                              <Image
                                source={{ uri: member.user.avatar_url }}
                                style={{ width: 36, height: 36, borderRadius: 18 }}
                              />
                            ) : (
                              <Text style={groupStyles.memberDropdownAvatarText}>
                                {member.user.full_name?.charAt(0).toUpperCase() || 'U'}
                              </Text>
                            )}
                          </View>
                          <View style={groupStyles.memberDropdownInfo}>
                            <Text style={groupStyles.memberDropdownName}>
                              {member.user.full_name}
                            </Text>
                            <Text style={groupStyles.memberDropdownEmail}>
                              {member.user.email}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>
              ) : (
                <View style={groupStyles.warningContainer}>
                  <Ionicons name="information-circle" size={20} color={COLORS.orange} />
                  <Text style={groupStyles.warningText}>
                    Chỉ quản lý mới có thể giao nhiệm vụ cho người khác
                  </Text>
                </View>
              )}

              <View style={groupStyles.modalButtonContainer}>
                <TouchableOpacity
                  style={[groupStyles.modalButton, groupStyles.modalButtonSecondary]}
                  onPress={() => {
                    setShowAddListModal(false);
                    setAssignedOwner(null);
                    setShowAssignMemberDropdown(false);
                  }}
                >
                  <Text style={[groupStyles.modalButtonText, groupStyles.modalButtonTextSecondary]}>
                    Hủy
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[groupStyles.modalButton, groupStyles.modalButtonPrimary]}
                  onPress={handleCreateShoppingList}
                >
                  <Text style={[groupStyles.modalButtonText, groupStyles.modalButtonTextPrimary]}>
                    Tạo
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Add Item Modal */}
      <Modal
        visible={showAddItemModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowAddItemModal(false);
          setSelectedListId(null);
          setNewItemIngredientId(null);
          setSelectedIngredient(null);
          setNewItemStock('500');
          setNewItemPrice('');
          setIngredientSearchTerm('');
          setSearchedIngredients([]);
        }}
      >
        <TouchableOpacity
          style={groupStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowAddItemModal(false);
            setSelectedListId(null);
            setNewItemIngredientId(null);
            setSelectedIngredient(null);
            setNewItemStock('500');
            setNewItemPrice('');
            setIngredientSearchTerm('');
            setSearchedIngredients([]);
          }}
        >
          <TouchableOpacity
            style={groupStyles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={groupStyles.modalHeader}>
              <Text style={groupStyles.modalTitle}>Thêm mặt hàng</Text>
              <TouchableOpacity
                style={groupStyles.modalCloseButton}
                onPress={() => {
                  setShowAddItemModal(false);
                  setSelectedListId(null);
                  setNewItemIngredientId(null);
                  setSelectedIngredient(null);
                  setNewItemStock('500');
                  setNewItemPrice('');
                  setIngredientSearchTerm('');
                  setSearchedIngredients([]);
                }}
              >
                <Ionicons name="close" size={24} color={COLORS.darkGrey} />
              </TouchableOpacity>
            </View>

            <View style={groupStyles.modalBody}>
              {/* Ingredient Search */}
              <View>
                <TextInput
                  style={groupStyles.modalInput}
                  placeholder="Tìm kiếm nguyên liệu..."
                  placeholderTextColor={COLORS.grey}
                  value={ingredientSearchTerm}
                  onChangeText={handleSearchIngredients}
                />

                {loadingIngredients && (
                  <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 8 }} />
                )}

                {searchedIngredients.length > 0 && (
                  <ScrollView style={groupStyles.ingredientSearchContainer}>
                    {searchedIngredients.map((ingredient, index) => (
                      <TouchableOpacity
                        key={ingredient.id}
                        style={[
                          groupStyles.ingredientSearchItem,
                          index === searchedIngredients.length - 1 && groupStyles.ingredientSearchItemLast,
                        ]}
                        onPress={() => handleSelectIngredient(ingredient)}
                      >
                        {ingredient.image_url ? (
                          <Image
                            source={{ uri: ingredient.image_url }}
                            style={groupStyles.ingredientSearchImage}
                          />
                        ) : (
                          <View style={groupStyles.ingredientSearchImage}>
                            <Ionicons name="nutrition-outline" size={20} color={COLORS.grey} />
                          </View>
                        )}
                        <View style={groupStyles.ingredientSearchInfo}>
                          <Text style={groupStyles.ingredientSearchName}>{ingredient.name}</Text>
                          {ingredient.price && (
                            <Text style={groupStyles.ingredientSearchPrice}>
                              {formatCurrency(ingredient.price)}/kg
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}

                {selectedIngredient && (
                  <View style={groupStyles.selectedIngredientCard}>
                    <View style={groupStyles.selectedIngredientInfo}>
                      {selectedIngredient.image_url ? (
                        <Image
                          source={{ uri: selectedIngredient.image_url }}
                          style={groupStyles.selectedIngredientImage}
                        />
                      ) : (
                        <View style={groupStyles.selectedIngredientImage}>
                          <Ionicons name="nutrition-outline" size={24} color={COLORS.primary} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={groupStyles.selectedIngredientName}>
                          {selectedIngredient.name}
                        </Text>
                        {selectedIngredient.price && (
                          <Text style={groupStyles.selectedIngredientPrice}>
                            {formatCurrency(selectedIngredient.price)}/kg
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedIngredient(null);
                          setNewItemIngredientId(null);
                          setNewItemPrice('');
                        }}
                      >
                        <Ionicons name="close-circle" size={20} color={COLORS.grey} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              {/* Stock Input */}
              <View>
                <TextInput
                  style={groupStyles.modalInput}
                  placeholder="Số lượng (gram)"
                  placeholderTextColor={COLORS.grey}
                  keyboardType="number-pad"
                  value={newItemStock}
                  onChangeText={setNewItemStock}
                  editable={!!selectedIngredient}
                />
                {!selectedIngredient && (
                  <Text style={groupStyles.helperText}>
                    Vui lòng chọn nguyên liệu trước
                  </Text>
                )}
              </View>

              {/* Price Display */}
              {newItemPrice && selectedIngredient && (
                <View style={groupStyles.priceDisplayContainer}>
                  <Ionicons name="pricetag" size={18} color="#7B1FA2" />
                  <Text style={groupStyles.priceDisplayText}>
                    Tổng giá: <Text style={groupStyles.priceDisplayAmount}>{formatCurrency(newItemPrice)}</Text>
                  </Text>
                </View>
              )}

              <View style={groupStyles.modalButtonContainer}>
                <TouchableOpacity
                  style={[groupStyles.modalButton, groupStyles.modalButtonSecondary]}
                  onPress={() => {
                    setShowAddItemModal(false);
                    setSelectedListId(null);
                    setNewItemIngredientId(null);
                    setSelectedIngredient(null);
                    setNewItemStock('500');
                    setNewItemPrice('');
                    setIngredientSearchTerm('');
                    setSearchedIngredients([]);
                  }}
                >
                  <Text style={[groupStyles.modalButtonText, groupStyles.modalButtonTextSecondary]}>
                    Hủy
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[groupStyles.modalButton, groupStyles.modalButtonPrimary]}
                  onPress={handleAddItem}
                >
                  <Text style={[groupStyles.modalButtonText, groupStyles.modalButtonTextPrimary]}>
                    Thêm
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        visible={showEditItemModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowEditItemModal(false);
          setEditingItem(null);
          setEditItemStock('');
          setEditItemPrice('');
        }}
      >
        <TouchableOpacity
          style={groupStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowEditItemModal(false);
            setEditingItem(null);
            setEditItemStock('');
            setEditItemPrice('');
          }}
        >
          <TouchableOpacity
            style={groupStyles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={groupStyles.modalHeader}>
              <Text style={groupStyles.modalTitle}>Chỉnh sửa mặt hàng</Text>
              <TouchableOpacity
                style={groupStyles.modalCloseButton}
                onPress={() => {
                  setShowEditItemModal(false);
                  setEditingItem(null);
                  setEditItemStock('');
                  setEditItemPrice('');
                }}
              >
                <Ionicons name="close" size={24} color={COLORS.darkGrey} />
              </TouchableOpacity>
            </View>

            <View style={groupStyles.modalBody}>
              {editingItem && (
                <>
                  {/* Ingredient Info */}
                  <View style={groupStyles.selectedIngredientCard}>
                    <View style={groupStyles.selectedIngredientInfo}>
                      {editingItem.ingredient?.image_url ? (
                        <Image
                          source={{ uri: editingItem.ingredient.image_url }}
                          style={groupStyles.selectedIngredientImage}
                        />
                      ) : (
                        <View style={groupStyles.selectedIngredientImage}>
                          <Ionicons name="nutrition-outline" size={24} color={COLORS.primary} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={groupStyles.selectedIngredientName}>
                          {editingItem.ingredient?.name || 'Nguyên liệu'}
                        </Text>
                        {editingItem.ingredient?.price && (
                          <Text style={groupStyles.selectedIngredientPrice}>
                            {formatCurrency(editingItem.ingredient.price)}/kg
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Stock Input */}
                  <View style={{ marginTop: 16 }}>
                    <Text style={groupStyles.modalLabel}>Số lượng (g)</Text>
                    <TextInput
                      style={groupStyles.modalInput}
                      placeholder="Nhập số lượng"
                      placeholderTextColor={COLORS.grey}
                      value={editItemStock}
                      onChangeText={(text) => {
                        setEditItemStock(text);
                        if (editingItem.ingredient?.price) {
                          const stock = parseInt(text) || 0;
                          const calculatedPrice = (editingItem.ingredient.price * stock / 1000).toFixed(0);
                          setEditItemPrice(calculatedPrice);
                        }
                      }}
                      keyboardType="numeric"
                    />
                  </View>

                  {/* Price Display */}
                  {editItemPrice && editingItem.ingredient?.price && (
                    <View style={groupStyles.priceDisplayContainer}>
                      <Ionicons name="pricetag" size={18} color="#7B1FA2" />
                      <Text style={groupStyles.priceDisplayText}>
                        Tổng giá: <Text style={groupStyles.priceDisplayAmount}>{formatCurrency(editItemPrice)}</Text>
                      </Text>
                    </View>
                  )}
                </>
              )}

              <View style={groupStyles.modalButtonContainer}>
                <TouchableOpacity
                  style={[groupStyles.modalButton, groupStyles.modalButtonSecondary]}
                  onPress={() => {
                    setShowEditItemModal(false);
                    setEditingItem(null);
                    setEditItemStock('');
                    setEditItemPrice('');
                  }}
                >
                  <Text style={[groupStyles.modalButtonText, groupStyles.modalButtonTextSecondary]}>
                    Hủy
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[groupStyles.modalButton, groupStyles.modalButtonPrimary]}
                  onPress={handleEditItem}
                >
                  <Text style={[groupStyles.modalButtonText, groupStyles.modalButtonTextPrimary]}>
                    Lưu
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
