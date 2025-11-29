import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, Text, ActivityIndicator, Modal, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateSelector from '../../components/DateSelector';
import FilterTabs from '../../components/FilterTabs';
import ShoppingListItem from '../../components/ShoppingListItem';
import { taskStyles } from '../../styles/task.styles';
import { getMyShoppingLists, getShoppingListById, checkShoppingItem, updateShoppingItem, createShoppingList } from '../../service/shopping';
import { COLORS } from '../../constants/themes';
import BottomNavigation from '../../components/BottomNavigation';

interface ShoppingItem {
  id: number;
  name: string;
  quantity: string;
  assignedTo?: string;
  isCompleted: boolean;
}

interface ShoppingList {
  id: number;
  owner_id: number;
  family_id?: number;
  items?: ShoppingItemAPI[];
}

interface ShoppingItemAPI {
  id: number;
  list_id: number;
  ingredient_id: number;
  stock: number;
  price?: number;
  is_checked: boolean;
  ingredient?: {
    id: number;
    name: string;
    unit?: string;
  };
}

export default function TaskPage() {
  const router = useRouter();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<number>(today.getDate());
  const [activeTab, setActiveTab] = useState('shopping');
  const [loading, setLoading] = useState(true);
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [familyId, setFamilyId] = useState<number | undefined>(undefined);

  // Load shopping lists on mount
  useEffect(() => {
    loadShoppingLists();
  }, []);

  // Load items when list is selected
  useEffect(() => {
    if (selectedListId) {
      loadShoppingListItems(selectedListId);
    } else if (shoppingLists.length > 0) {
      // Auto-select first list if available
      setSelectedListId(shoppingLists[0].id);
    }
  }, [selectedListId, shoppingLists]);

  const loadShoppingLists = async () => {
    try {
      setLoading(true);
      const lists = await getMyShoppingLists();
      setShoppingLists(lists || []);
      if (lists && lists.length > 0) {
        setSelectedListId(lists[0].id);
      }
    } catch (error: any) {
      console.error('Error loading shopping lists:', error);
      if (error.message === 'SESSION_EXPIRED' || error.response?.status === 401) {
        Alert.alert('Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại');
        router.push('/(auth)/login');
      } else {
        Alert.alert('Lỗi', 'Không thể tải danh sách mua sắm');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadShoppingListItems = async (listId: number) => {
    try {
      setLoading(true);
      const list = await getShoppingListById(listId);
      if (list && list.items) {
        // Map API response to component format
        const mappedItems: ShoppingItem[] = list.items.map((item: ShoppingItemAPI) => ({
          id: item.id,
          name: item.ingredient?.name || 'Unknown',
          quantity: `${item.stock}${item.ingredient?.unit || ''}`,
          assignedTo: undefined, // TODO: Get from owner or assignee
          isCompleted: item.is_checked || false,
        }));
        setShoppingItems(mappedItems);
      } else {
        setShoppingItems([]);
      }
    } catch (error: any) {
      console.error('Error loading shopping list items:', error);
      if (error.message === 'SESSION_EXPIRED' || error.response?.status === 401) {
        Alert.alert('Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại');
        router.push('/(auth)/login');
      } else {
        Alert.alert('Lỗi', 'Không thể tải danh sách mua sắm');
      }
      setShoppingItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabPress = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'add') {
      setShowCreateModal(true);
    } else if (tab === 'home') {
      router.push('/(home)');
    } else if (tab === 'calendar') {
      // Already on task page
    }
  };

  const handleCreateShoppingList = async () => {
    try {
      setIsCreating(true);
      const newList = await createShoppingList({
        family_id: familyId,
        is_shared: false,
      });
      
      Alert.alert('Thành công', 'Đã tạo danh sách mua sắm mới');
      setShowCreateModal(false);
      setFamilyId(undefined);
      
      // Reload lists and select the new one
      await loadShoppingLists();
      if (newList && newList.id) {
        setSelectedListId(newList.id);
      }
    } catch (error: any) {
      console.error('Error creating shopping list:', error);
      if (error.message === 'SESSION_EXPIRED' || error.response?.status === 401) {
        Alert.alert('Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại');
        router.push('/(auth)/login');
      } else {
        Alert.alert('Lỗi', 'Không thể tạo danh sách mua sắm');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleDateSelect = (date: number) => {
    setSelectedDate(date);
    console.log('Selected date:', date);
  };

  const handleTabSelect = (tab: string) => {
    setActiveTab(tab);
    console.log('Selected tab:', tab);
  };

  const handleToggleComplete = async (id: number) => {
    try {
      // Optimistic update
      setShoppingItems(items =>
        items.map(item =>
          item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
        )
      );

      // Call API
      await checkShoppingItem(id);
    } catch (error: any) {
      console.error('Error toggling item:', error);
      // Revert on error
      setShoppingItems(items =>
        items.map(item =>
          item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
        )
      );
      if (error.message === 'SESSION_EXPIRED' || error.response?.status === 401) {
        Alert.alert('Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại');
        router.push('/(auth)/login');
      } else {
        Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
      }
    }
  };

  const handleQuantityChange = async (id: number, delta: number) => {
    try {
      const currentItem = shoppingItems.find(item => item.id === id);
      if (!currentItem) return;

      // Extract current quantity number
      const quantityMatch = currentItem.quantity.match(/(\d+)/);
      const currentQuantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
      const newQuantity = Math.max(1, currentQuantity + delta);

      // Optimistic update
      setShoppingItems(items =>
        items.map(item =>
          item.id === id 
            ? { ...item, quantity: `${newQuantity}${currentItem.quantity.replace(/\d+/, '')}` }
            : item
        )
      );

      // Call API - need to get the original item to update stock
      const list = await getShoppingListById(selectedListId!);
      const apiItem = list?.items?.find((item: ShoppingItemAPI) => item.id === id);
      if (apiItem) {
        await updateShoppingItem(id, { stock: newQuantity });
      }
    } catch (error: any) {
      console.error('Error updating quantity:', error);
      // Reload items on error
      if (selectedListId) {
        loadShoppingListItems(selectedListId);
      }
      if (error.message === 'SESSION_EXPIRED' || error.response?.status === 401) {
        Alert.alert('Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại');
        router.push('/(auth)/login');
      } else {
        Alert.alert('Lỗi', 'Không thể cập nhật số lượng');
      }
    }
  };

  const handleAssign = (id: number) => {
    Alert.alert('Gán nhiệm vụ', 'Chức năng này sẽ được triển khai sau');
  };

  return (
    <View style={taskStyles.container}>
      {/* Content */}
      <ScrollView 
        style={taskStyles.content} 
        showsVerticalScrollIndicator={false}
      >
        {/* Filter Tabs */}
        <FilterTabs 
          activeTab={activeTab} 
          onSelectTab={handleTabSelect} 
        />
        
        {/* Date Selector */}
        <DateSelector 
          selectedDate={selectedDate} 
          onSelectDate={handleDateSelect} 
        />
        
        {/* Shopping List */}
        {activeTab === 'shopping' && (
          <View style={taskStyles.taskList}>
            {loading ? (
              <View style={taskStyles.emptyState}>
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text style={[taskStyles.emptyStateText, { marginTop: 16 }]}>
                  Đang tải danh sách...
                </Text>
              </View>
            ) : shoppingItems.length > 0 ? (
              shoppingItems.map(item => (
                <ShoppingListItem
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  quantity={item.quantity}
                  assignedTo={item.assignedTo}
                  isCompleted={item.isCompleted}
                  onToggleComplete={handleToggleComplete}
                  onQuantityChange={handleQuantityChange}
                  onAssign={handleAssign}
                />
              ))
            ) : (
              <View style={taskStyles.emptyState}>
                <Text style={taskStyles.emptyStateText}>
                  Danh sách cho ngày này trống. Nhấn + để thêm mặt hàng mới!
                </Text>
              </View>
            )}
          </View>
        )}
        
        {/* Members Tab Content */}
        {activeTab === 'members' && (
          <View style={taskStyles.taskList}>
            <Text style={taskStyles.emptyStateText}>
              Danh sách thành viên nhóm
            </Text>
          </View>
        )}
      </ScrollView>
      
      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab="calendar"
        onTabPress={handleTabPress}
      />

      {/* Create Shopping List Modal */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tạo danh sách mua sắm mới</Text>
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={COLORS.darkGrey} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalDescription}>
                Tạo một danh sách mua sắm mới để quản lý các mặt hàng cần mua.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ID Gia đình (tùy chọn)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập ID gia đình (để trống nếu không có)"
                  placeholderTextColor={COLORS.grey}
                  keyboardType="numeric"
                  value={familyId?.toString() || ''}
                  onChangeText={(text) => setFamilyId(text ? parseInt(text) : undefined)}
                />
              </View>

              <TouchableOpacity
                style={[styles.createButton, isCreating && styles.createButtonDisabled]}
                onPress={handleCreateShoppingList}
                disabled={isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.createButtonText}>Tạo danh sách</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowCreateModal(false);
                  setFamilyId(undefined);
                }}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.darkGrey,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalDescription: {
    fontSize: 14,
    color: COLORS.darkGrey,
    opacity: 0.7,
    marginBottom: 24,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGrey,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.darkGrey,
    borderWidth: 1,
    borderColor: COLORS.lightGrey,
  },
  createButton: {
    backgroundColor: COLORS.purple,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.darkGrey,
    fontSize: 16,
    fontWeight: '500',
  },
});