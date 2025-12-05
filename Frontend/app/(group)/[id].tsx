import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/themes';
import { getFamilyById, getInvitationCode } from '../../service/family';
import { familyDetailStyles } from '../../styles/familyDetail.styles';
import ActionMenu from '../../components/ActionMenu';
import InvitationModal from '../../components/InvitationModal';

interface FamilyMember {
  id: number;
  family_id: number;
  user_id: number;
  role: 'member' | 'manager';
  joined_at: string;
  user?: {
    id: number;
    full_name: string;
    avatar_url?: string;
    email: string;
  };
}

interface Family {
  id: number;
  name: string;
  owner_id: number;
  invitation_code: string | null;
  created_at: string;
  members: FamilyMember[];
}

type TabType = 'shopping' | 'members';

export default function FamilyDetailPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const familyId = params.id ? Number(params.id) : null;

  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('shopping'); // Default to shopping tab as in image 2
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showFamilyMenu, setShowFamilyMenu] = useState(false);
  const [showMemberMenu, setShowMemberMenu] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [showInvitationModal, setShowInvitationModal] = useState(false);

  useEffect(() => {
    if (familyId) {
      fetchFamily();
      // TODO: Get current user ID from auth context or storage
    }
  }, [familyId]);

  const fetchFamily = async () => {
    if (!familyId) return;

    try {
      setLoading(true);
      const response = await getFamilyById(familyId);
      
      // Handle both direct object and wrapped response
      const familyData = response?.data || response || response;
      setFamily(familyData);
    } catch (error: any) {
      console.error('Error fetching family:', error);
      if (error?.message === 'SESSION_EXPIRED' || error?.response?.status === 401) {
        Alert.alert('Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại');
        router.replace('/(auth)/login');
      } else {
        Alert.alert('Lỗi', 'Không thể tải thông tin gia đình. Vui lòng thử lại.');
        router.back();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
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

  const handleMemberMenu = (member: FamilyMember) => {
    setSelectedMember(member);
    setShowMemberMenu(true);
  };

  const getMemberMenuOptions = () => {
    if (!selectedMember) return [];
    
    const isCurrentUser = selectedMember.user_id === currentUserId;
    const isManager = selectedMember.role === 'manager';
    const options = [];

    options.push({
      label: 'Xem thông tin',
      icon: 'person-outline' as const,
      onPress: () => {
        // TODO: Show member info
        console.log('View member info:', selectedMember.id);
        Alert.alert(
          'Thông tin thành viên',
          `Tên: ${selectedMember.user?.full_name || 'N/A'}\nEmail: ${selectedMember.user?.email || 'N/A'}\nVai trò: ${isManager ? 'Quản trị viên' : 'Thành viên'}`,
        );
      },
    });

    if (!isCurrentUser) {
      if (isManager) {
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

  const handleAddMember = () => {
    // TODO: Navigate to add member page
    console.log('Add member');
  };

  const filteredMembers = family?.members?.filter((member) => {
    if (!searchQuery.trim()) return true;
    const name = member.user?.full_name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  const memberCount = family?.members?.length || 0;

  const renderTabs = () => {
    return (
      <View style={familyDetailStyles.tabContainer}>
        <TouchableOpacity
          style={[
            familyDetailStyles.tab,
            activeTab === 'shopping' && familyDetailStyles.tabActive,
          ]}
          onPress={() => setActiveTab('shopping')}
        >
          <Text
            style={[
              familyDetailStyles.tabText,
              activeTab === 'shopping' && familyDetailStyles.tabTextActive,
            ]}
          >
            Danh sách mua sắm
          </Text>
          {activeTab === 'shopping' && (
            <View style={familyDetailStyles.tabUnderline} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            familyDetailStyles.tab,
            activeTab === 'members' && familyDetailStyles.tabActive,
          ]}
          onPress={() => setActiveTab('members')}
        >
          <Text
            style={[
              familyDetailStyles.tabText,
              activeTab === 'members' && familyDetailStyles.tabTextActive,
            ]}
          >
            Thành viên nhóm
          </Text>
          {activeTab === 'members' && (
            <View style={familyDetailStyles.tabUnderline} />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderMembersTab = () => {
    return (
      <View style={familyDetailStyles.membersContainer}>
        {/* Member Count */}
        <Text style={familyDetailStyles.memberCount}>
          {memberCount} thành viên
        </Text>

        {/* Search Bar */}
        <View style={familyDetailStyles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={COLORS.grey}
            style={familyDetailStyles.searchIcon}
          />
          <TextInput
            style={familyDetailStyles.searchInput}
            placeholder="Tìm thành viên theo tên"
            placeholderTextColor={COLORS.grey}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Members List */}
        <ScrollView
          style={familyDetailStyles.membersList}
          showsVerticalScrollIndicator={false}
        >
          {filteredMembers.length === 0 ? (
            <View style={familyDetailStyles.emptyState}>
              <Ionicons name="people-outline" size={48} color={COLORS.grey} />
              <Text style={familyDetailStyles.emptyStateText}>
                {searchQuery ? 'Không tìm thấy thành viên' : 'Chưa có thành viên nào'}
              </Text>
            </View>
          ) : (
            filteredMembers.map((member) => {
              const isCurrentUser = member.user_id === currentUserId;
              const userName = member.user?.full_name || `User ${member.user_id}`;
              const avatarUrl = member.user?.avatar_url;
              const isManager = member.role === 'manager';

              return (
                <TouchableOpacity
                  key={member.id}
                  style={familyDetailStyles.memberCard}
                  onPress={() => handleMemberMenu(member)}
                  activeOpacity={0.7}
                >
                  {/* Avatar */}
                  <View style={familyDetailStyles.memberAvatarContainer}>
                    {avatarUrl ? (
                      <Image
                        source={{ uri: avatarUrl }}
                        style={familyDetailStyles.memberAvatar}
                      />
                    ) : (
                      <View style={familyDetailStyles.memberAvatarPlaceholder}>
                        <Ionicons
                          name="person"
                          size={24}
                          color={COLORS.white}
                        />
                      </View>
                    )}
                  </View>

                  {/* Member Info */}
                  <View style={familyDetailStyles.memberInfo}>
                    <View style={familyDetailStyles.memberNameRow}>
                      <Text style={familyDetailStyles.memberName}>
                        {userName}
                      </Text>
                      {isManager && (
                        <View style={familyDetailStyles.roleBadge}>
                          <Text style={familyDetailStyles.roleBadgeText}>
                            Quản trị viên
                          </Text>
                        </View>
                      )}
                    </View>
                    {isCurrentUser && (
                      <Text style={familyDetailStyles.memberRelationship}>
                        (Bạn)
                      </Text>
                    )}
                  </View>

                  {/* Menu Button */}
                  <TouchableOpacity
                    style={familyDetailStyles.memberMenuButton}
                    onPress={() => handleMemberMenu(member)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="ellipsis-vertical"
                      size={20}
                      color={COLORS.darkGrey}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    );
  };

  const renderShoppingTab = () => {
    return (
      <View style={familyDetailStyles.shoppingContainer}>
        <Text style={familyDetailStyles.comingSoonText}>
          Tính năng đang phát triển
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={familyDetailStyles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={familyDetailStyles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.purple} />
        </View>
      </View>
    );
  }

  if (!family) {
    return (
      <View style={familyDetailStyles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={familyDetailStyles.emptyState}>
          <Text style={familyDetailStyles.emptyStateText}>
            Không tìm thấy gia đình
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={familyDetailStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={familyDetailStyles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={familyDetailStyles.headerIcon}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.darkGrey} />
        </TouchableOpacity>

        <Text style={familyDetailStyles.headerTitle} numberOfLines={1}>
          {family.name}
        </Text>

        <TouchableOpacity
          onPress={handleMenu}
          style={familyDetailStyles.headerIcon}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={24}
            color={COLORS.darkGrey}
          />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      {renderTabs()}

      {/* Content */}
      <View style={familyDetailStyles.content}>
        {activeTab === 'shopping' ? renderShoppingTab() : renderMembersTab()}
      </View>

      {/* FAB for adding member */}
      {activeTab === 'members' && (
        <TouchableOpacity
          style={familyDetailStyles.fab}
          onPress={handleAddMember}
          activeOpacity={0.8}
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
            const response = await getInvitationCode(id);
            // Handle both direct object and wrapped response
            return response?.data || response;
          }}
        />
      )}
    </View>
  );
}

