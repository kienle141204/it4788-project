import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { groupStyles } from '../../styles/group.styles';
import { COLORS } from '../../constants/themes';
import { getFamilyById, getFamilyInvitationCode } from '../../service/family';
import {
  getShoppingListsByFamily,
  createShoppingList,
  addItemToList,
  toggleItemChecked,
  deleteShoppingItem,
  deleteShoppingList,
  type ShoppingList,
  type ShoppingItem,
} from '../../service/shoppingList';
import { searchIngredients } from '../../service/market';
import { getAccess } from '../../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ActionMenu from '../../components/ActionMenu';
import InvitationModal from '../../components/InvitationModal';

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
      console.log('[Manager Check] No token found');
      return null;
    }
    const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
    const decoded = decodeJWT(cleanToken);
    if (decoded && decoded.sub) {
      const userId = parseInt(decoded.sub, 10);
      console.log('[Manager Check] Decoded user ID from token:', { sub: decoded.sub, userId, decoded });
      return userId;
    }
    console.log('[Manager Check] No sub in decoded token:', decoded);
    return null;
  } catch (error) {
    console.error('[Manager Check] Error getting current user ID:', error);
    return null;
  }
};

export default function GroupDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const familyId = parseInt(id as string);

  const [activeTab, setActiveTab] = useState<'shopping' | 'members'>('shopping');
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

  // Menu states
  const [showFamilyMenu, setShowFamilyMenu] = useState(false);
  const [showMemberMenu, setShowMemberMenu] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  
  // Member profile states
  const [showMemberProfileModal, setShowMemberProfileModal] = useState(false);
  const [memberProfile, setMemberProfile] = useState<any>(null);
  const [loadingMemberProfile, setLoadingMemberProfile] = useState(false);

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

      // Fetch family details
      const familyData = await getFamilyById(familyId);
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
          role: member.role,
          joined_at: member.joined_at,
          user: {
            id: member.user?.id || member.user_id,
            full_name: member.user?.full_name || member.user?.fullname || '',
            email: member.user?.email || '',
            avatar_url: member.user?.avatar_url || null,
          },
        }));
      }

      // Fetch shopping lists (handle error gracefully)
      let shoppingListsData: ShoppingList[] = [];
      try {
        shoppingListsData = await getShoppingListsByFamily(familyId);
      } catch (shoppingError: any) {
        console.warn('Could not fetch shopping lists:', shoppingError);
        // Continue without shopping lists if endpoint fails
      }

      setMembers(membersData);
      setShoppingLists(shoppingListsData);
    } catch (err: any) {
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        handleSessionExpired();
        return;
      }
      console.error('Error fetching family data:', err);
      setError('Không thể tải thông tin gia đình. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [familyId, handleSessionExpired]);

  // Get current user ID from JWT token
  useEffect(() => {
    const loadCurrentUserId = async () => {
      const userId = await getCurrentUserId();
      console.log('[Manager Check] Loaded currentUserId:', userId);
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
      console.log('[Manager Check] Missing data:', { currentUserId, membersCount: members.length });
      return null;
    }
    
    // Convert both to numbers for comparison to avoid type mismatch
    const foundMember = members.find(member => Number(member.user_id) === Number(currentUserId)) || null;
    
    console.log('[Manager Check] Current member found:', {
      currentUserId,
      foundMember: foundMember ? { id: foundMember.id, user_id: foundMember.user_id, role: foundMember.role } : null,
      allMembers: members.map(m => ({ id: m.id, user_id: m.user_id, role: m.role }))
    });
    
    return foundMember;
  }, [currentUserId, members]);

  const isManager = useMemo(() => {
    const result = currentMember?.role === 'manager';
    console.log('[Manager Check] isManager:', {
      currentMemberRole: currentMember?.role,
      isManager: result
    });
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

  const getFamilyMenuOptions = () => {
    if (!family) return [];
    
    return [
      {
        label: 'Mã mời',
        icon: 'qr-code-outline' as const,
        onPress: () => {
          setShowInvitationModal(true);
        },
      },
      {
        label: 'Chỉnh sửa thông tin',
        icon: 'create-outline' as const,
        onPress: () => {
          // TODO: Navigate to edit family
          console.log('Edit family');
        },
      },
      {
        label: 'Cài đặt',
        icon: 'settings-outline' as const,
        onPress: () => {
          // TODO: Navigate to settings
          console.log('Navigate to settings');
        },
      },
      {
        label: 'Rời khỏi nhóm',
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
                  console.log('Leave family:', family.id);
                },
              },
            ]
          );
        },
        destructive: true,
      },
    ];
  };

  const handleMemberMenu = (member: Member) => {
    setSelectedMember(member);
    setShowMemberMenu(true);
  };

  const fetchMemberProfile = useCallback(async (userId: number) => {
    setLoadingMemberProfile(true);
    try {
      const payload = await getAccess(`users/${userId}`);
      if (payload?.success !== false && payload?.data) {
        setMemberProfile(payload.data);
        setShowMemberProfileModal(true);
      } else {
        throw new Error(payload?.message || 'Không thể tải thông tin thành viên');
      }
    } catch (err: any) {
      if (err instanceof Error && err.message === 'SESSION_EXPIRED') {
        handleSessionExpired();
        return;
      }
      console.error('fetchMemberProfile error', err);
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
                    console.log('Remove manager role:', selectedMember.id);
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
                    console.log('Grant manager role:', selectedMember.id);
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
                  console.log('Remove member:', selectedMember.id);
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

  // Filter shopping lists by selected date
  const filteredShoppingLists = useMemo(() => {
    return shoppingLists.filter(list => {
      const listDate = new Date(list.shopping_date);
      return isSameDay(listDate, selectedDate);
    });
  }, [shoppingLists, selectedDate]);

  // Handle create shopping list
  const handleCreateShoppingList = async () => {
    try {
      // Format date in local timezone (YYYY-MM-DD)
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      // Ensure owner_id is number or undefined (not null or string)
      const ownerId = assignedOwner ? Number(assignedOwner.user_id) : undefined;
      
      console.log('Creating shopping list with:', { familyId, dateStr, ownerId });
      
      await createShoppingList(familyId, dateStr, ownerId);
      await fetchFamilyData(true);
      setShowAddListModal(false);
      setAssignedOwner(null);
      setShowAssignMemberDropdown(false);
      Alert.alert('Thành công', 'Đã tạo danh sách mua sắm mới');
    } catch (error) {
      console.error('Error creating shopping list:', error);
      Alert.alert('Lỗi', 'Không thể tạo danh sách mua sắm');
    }
  };

  // Handle delete shopping list
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
            try {
              await deleteShoppingList(listId);
              await fetchFamilyData(true);
              Alert.alert('Thành công', 'Đã xóa danh sách mua sắm');
            } catch (error) {
              console.error('Error deleting shopping list:', error);
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
      console.error('Error searching ingredients:', error);
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

  // Handle add item to list
  const handleAddItem = async () => {
    if (!selectedListId || !newItemIngredientId || !newItemStock) {
      Alert.alert('Lỗi', 'Vui lòng chọn nguyên liệu và nhập số lượng');
      return;
    }

    try {
      // Ensure all values are correct types
      const listId = Number(selectedListId);
      const ingredientId = Number(newItemIngredientId);
      const stock = parseInt(newItemStock);
      const price = newItemPrice ? parseFloat(newItemPrice) : undefined;
      
      // Validate numbers
      if (isNaN(listId) || isNaN(ingredientId) || isNaN(stock)) {
        Alert.alert('Lỗi', 'Dữ liệu không hợp lệ');
        return;
      }
      
      console.log('Adding item with:', { listId, ingredientId, stock, price });
      
      await addItemToList(listId, ingredientId, stock, price);
      await fetchFamilyData(true);
      
      // Reset form
      setShowAddItemModal(false);
      setSelectedListId(null);
      setNewItemIngredientId(null);
      setSelectedIngredient(null);
      setNewItemStock('500');
      setNewItemPrice('');
      setIngredientSearchTerm('');
      setSearchedIngredients([]);
      
      Alert.alert('Thành công', 'Đã thêm mặt hàng vào danh sách');
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Lỗi', 'Không thể thêm mặt hàng');
    }
  };

  // Handle toggle item checked
  const handleToggleItem = async (itemId: number) => {
    try {
      await toggleItemChecked(itemId);
      await fetchFamilyData(true);
    } catch (error) {
      console.error('Error toggling item:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
    }
  };

  // Handle delete item
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
            try {
              await deleteShoppingItem(itemId);
              await fetchFamilyData(true);
              Alert.alert('Thành công', 'Đã xóa mặt hàng');
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Lỗi', 'Không thể xóa mặt hàng');
            }
          },
        },
      ]
    );
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
        {filteredMembers.map(member => (
          <TouchableOpacity
            key={member.id}
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
              member.role === 'manager' ? groupStyles.roleBadgeManager : groupStyles.roleBadgeMember
            ]}>
              <Text style={[
                groupStyles.roleText,
                member.role === 'manager' ? groupStyles.roleTextManager : groupStyles.roleTextMember
              ]}>
                {member.role === 'manager' ? 'Quản lý' : 'Thành viên'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
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
      <TouchableOpacity
        key={item.id}
        style={groupStyles.shoppingItemRow}
        onPress={() => handleToggleItem(item.id)}
        onLongPress={() => handleDeleteItem(item.id)}
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

        <View style={groupStyles.itemInfo}>
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

        <Text style={groupStyles.itemQuantity}>
          {item.price ? `${((item.price * item.stock) / 1000).toLocaleString()}đ` : ''}
        </Text>
      </TouchableOpacity>
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
                        <View style={groupStyles.ownerAvatar} />
                        <Text style={groupStyles.ownerName}>
                          {list.owner.full_name}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={groupStyles.shoppingListCost}>
                    {list.cost.toLocaleString()}đ
                  </Text>
                </View>

                <View style={groupStyles.shoppingItemsContainer}>
                  {list.items && list.items.length > 0 ? (
                    list.items.map(item => renderShoppingItem(item, list))
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
                  <Ionicons name="add" size={20} color={COLORS.purple} />
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
      <View style={groupStyles.tabContainer}>
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
            activeTab === 'members' && groupStyles.tabActive
          ]}
          onPress={() => setActiveTab('members')}
        >
          <Text style={[
            groupStyles.tabText,
            activeTab === 'members' && groupStyles.tabTextActive
          ]}>
            Thành viên nhóm
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
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
                onPress={() => fetchFamilyData()}
              >
                <Text style={groupStyles.retryButtonText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {activeTab === 'members' && (
                <>
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
                </>
              )}
              
              {activeTab === 'members' ? renderMembersList() : renderShoppingList()}
            </>
          )}
        </ScrollView>
      )}

      {/* FAB Button - Only show in shopping tab */}
      {activeTab === 'shopping' && !loading && (
        <TouchableOpacity
          style={groupStyles.fabButton}
          onPress={() => {
            console.log('[Manager Check] FAB button pressed - Opening modal');
            console.log('[Manager Check] Current state:', {
              currentUserId,
              membersCount: members.length,
              currentMember: currentMember ? { id: currentMember.id, user_id: currentMember.user_id, role: currentMember.role } : null,
              isManager
            });
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
                  <ActivityIndicator size="large" color={COLORS.purple} />
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
              {(() => {
                console.log('[Manager Check] Modal render - Checking manager status:', {
                  hasFamily: !!family,
                  isManager,
                  currentUserId,
                  currentMember: currentMember ? { id: currentMember.id, user_id: currentMember.user_id, role: currentMember.role } : null
                });
                return null;
              })()}
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
                  <ActivityIndicator size="small" color={COLORS.purple} style={{ marginTop: 8 }} />
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
                              {ingredient.price.toLocaleString()}đ/kg
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
                          <Ionicons name="nutrition-outline" size={24} color={COLORS.purple} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={groupStyles.selectedIngredientName}>
                          {selectedIngredient.name}
                        </Text>
                        {selectedIngredient.price && (
                          <Text style={groupStyles.selectedIngredientPrice}>
                            {selectedIngredient.price.toLocaleString()}đ/kg
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
                    Tổng giá: <Text style={groupStyles.priceDisplayAmount}>{parseInt(newItemPrice).toLocaleString()}đ</Text>
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
    </View>
  );
}
