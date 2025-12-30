import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, Image, TouchableOpacity } from 'react-native';
import { COLORS } from '../../constants/themes';
import { getMyShoppingLists } from '../../service/statistics';
import { Ionicons } from '@expo/vector-icons';

interface Ingredient {
    id: string;
    category_id: string;
    name: string;
    description?: string;
    price: string;
    image_url?: string;
    created_at: string;
    place_id?: number;
}

interface ShoppingItem {
    id: string;
    list_id: string;
    ingredient_id: string;
    stock: number;
    price: string;
    is_checked: boolean;
    created_at: string;
    ingredient?: Ingredient;
}

interface Family {
    id: string;
    name: string;
    owner_id: string;
    invitation_code?: string;
    created_at: string;
}

interface ShoppingList {
    id: string;
    owner_id: string;
    cost: string;
    created_at: string;
    family_id: string;
    is_shared: boolean;
    shopping_date: string;
    family?: Family;
    items: ShoppingItem[];
}

export default function ShoppingHistory() {
    const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedListId, setExpandedListId] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const lists = await getMyShoppingLists();
                setShoppingLists(lists || []);
            } catch (err: any) {
                setError('Không thể tải dữ liệu lịch sử mua sắm');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatCurrency = (amount: string | number) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // Tính tổng chi tiêu
    const totalCost = shoppingLists.reduce((sum, list) => {
        return sum + (parseFloat(list.cost) || 0);
    }, 0);

    // Tính tổng số items đã mua (is_checked = true)
    const totalCheckedItems = shoppingLists.reduce((sum, list) => {
        return sum + list.items.filter(item => item.is_checked).length;
    }, 0);

    const toggleExpand = (listId: string) => {
        setExpandedListId(expandedListId === listId ? null : listId);
    };

    const renderItem = ({ item: shoppingItem }: { item: ShoppingItem }) => (
        <View style={styles.itemCard}>
            <View style={styles.imageContainer}>
                {shoppingItem.ingredient?.image_url ? (
                    <Image
                        source={{ uri: shoppingItem.ingredient.image_url }}
                        style={styles.ingredientImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.placeholderImage}>
                        <Ionicons name="nutrition" size={24} color={COLORS.purple} />
                    </View>
                )}
            </View>

            <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>
                    {shoppingItem.ingredient?.name || 'Không xác định'}
                </Text>
                <View style={styles.itemDetails}>
                    <View style={styles.detailRow}>
                        <Ionicons name="cube-outline" size={14} color={COLORS.grey} />
                        <Text style={styles.detailText}>SL: {shoppingItem.stock || 0}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.priceContainer}>
                <Text style={styles.priceText}>{formatCurrency(shoppingItem.price)}</Text>
                {shoppingItem.is_checked && (
                    <View style={styles.checkedBadge}>
                        <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                        <Text style={styles.checkedText}>Đã mua</Text>
                    </View>
                )}
            </View>
        </View>
    );

    const renderShoppingList = ({ item: list }: { item: ShoppingList }) => {
        const isExpanded = expandedListId === list.id;
        const checkedItems = list.items.filter(i => i.is_checked).length;

        return (
            <View style={styles.listCard}>
                <TouchableOpacity
                    style={styles.listHeader}
                    onPress={() => toggleExpand(list.id)}
                    activeOpacity={0.7}
                >
                    <View style={styles.listIconContainer}>
                        <Ionicons name="cart" size={24} color={COLORS.purple} />
                    </View>

                    <View style={styles.listInfo}>
                        <View style={styles.listTitleRow}>
                            <Text style={styles.listDate}>{formatDate(list.shopping_date)}</Text>
                            {list.is_shared && (
                                <View style={styles.sharedBadge}>
                                    <Ionicons name="people" size={12} color={COLORS.purple} />
                                    <Text style={styles.sharedText}>Chia sẻ</Text>
                                </View>
                            )}
                        </View>

                        {list.family && (
                            <View style={styles.familyRow}>
                                <Ionicons name="home-outline" size={12} color={COLORS.grey} />
                                <Text style={styles.familyName} numberOfLines={1}>
                                    {list.family.name}
                                </Text>
                            </View>
                        )}

                        <View style={styles.listMeta}>
                            <Text style={styles.itemCount}>
                                {checkedItems}/{list.items.length} sản phẩm đã mua
                            </Text>
                        </View>
                    </View>

                    <View style={styles.listRight}>
                        <Text style={styles.costText}>{formatCurrency(list.cost)}</Text>
                        <Ionicons
                            name={isExpanded ? "chevron-up" : "chevron-down"}
                            size={20}
                            color={COLORS.grey}
                        />
                    </View>
                </TouchableOpacity>

                {isExpanded && list.items.length > 0 && (
                    <View style={styles.itemsContainer}>
                        <View style={styles.itemsDivider} />
                        {list.items.map((item) => (
                            <View key={item.id}>
                                {renderItem({ item })}
                            </View>
                        ))}
                    </View>
                )}

                {isExpanded && list.items.length === 0 && (
                    <View style={styles.noItemsContainer}>
                        <Text style={styles.noItemsText}>Chưa có sản phẩm nào</Text>
                    </View>
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.purple} />
                <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Summary Card */}
            <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                    <View style={styles.summaryIconContainer}>
                        <Ionicons name="wallet" size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.summaryContent}>
                        <Text style={styles.summaryLabel}>Tổng chi tiêu cá nhân</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(totalCost)}</Text>
                    </View>
                </View>
                <View style={styles.summaryStats}>
                    <View style={styles.statItem}>
                        <Ionicons name="list" size={18} color="rgba(255,255,255,0.9)" />
                        <Text style={styles.statValue}>{shoppingLists.length}</Text>
                        <Text style={styles.statLabel}>Danh sách</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Ionicons name="checkmark-done" size={18} color="rgba(255,255,255,0.9)" />
                        <Text style={styles.statValue}>{totalCheckedItems}</Text>
                        <Text style={styles.statLabel}>Đã mua</Text>
                    </View>
                </View>
            </View>

            {/* Shopping Lists */}
            <View style={styles.listSection}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Lịch sử mua sắm</Text>
                    <View style={styles.sectionBadge}>
                        <Text style={styles.sectionBadgeText}>{shoppingLists.length} danh sách</Text>
                    </View>
                </View>

                {shoppingLists.length > 0 ? (
                    <FlatList
                        data={shoppingLists}
                        renderItem={renderShoppingList}
                        keyExtractor={(item) => item.id.toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContent}
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="cart-outline" size={64} color={COLORS.grey} />
                        <Text style={styles.emptyText}>Chưa có danh sách mua sắm nào</Text>
                        <Text style={styles.emptySubtext}>Hãy tạo danh sách mua sắm đầu tiên</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: COLORS.grey,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 20,
    },
    errorText: {
        marginTop: 16,
        fontSize: 16,
        color: '#EF4444',
        textAlign: 'center',
    },
    summaryCard: {
        backgroundColor: '#4F46E5',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    summaryIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    summaryContent: {
        flex: 1,
    },
    summaryLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 4,
        fontWeight: '500',
    },
    summaryValue: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    summaryStats: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        padding: 12,
    },
    statItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginHorizontal: 8,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
    },
    listSection: {
        flex: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.darkGrey,
    },
    sectionBadge: {
        backgroundColor: '#E0E7FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    sectionBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4F46E5',
    },
    listContent: {
        paddingBottom: 20,
    },
    listCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden',
    },
    listHeader: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
    },
    listIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#F3E8FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    listInfo: {
        flex: 1,
    },
    listTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    listDate: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.darkGrey,
    },
    sharedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3E8FF',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        gap: 4,
    },
    sharedText: {
        fontSize: 11,
        color: COLORS.purple,
        fontWeight: '600',
    },
    familyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    familyName: {
        fontSize: 13,
        color: COLORS.grey,
        flex: 1,
    },
    listMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemCount: {
        fontSize: 13,
        color: COLORS.grey,
    },
    listRight: {
        alignItems: 'flex-end',
        gap: 4,
    },
    costText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#10B981',
    },
    itemsContainer: {
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    itemsDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginBottom: 12,
    },
    itemCard: {
        flexDirection: 'row',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        alignItems: 'center',
    },
    imageContainer: {
        marginRight: 12,
    },
    ingredientImage: {
        width: 48,
        height: 48,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
    },
    placeholderImage: {
        width: 48,
        height: 48,
        borderRadius: 10,
        backgroundColor: '#F3E8FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.darkGrey,
        marginBottom: 4,
    },
    itemDetails: {
        gap: 2,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    detailText: {
        fontSize: 12,
        color: COLORS.grey,
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    priceText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#10B981',
        marginBottom: 4,
    },
    checkedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 10,
        gap: 3,
    },
    checkedText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#059669',
    },
    noItemsContainer: {
        padding: 16,
        alignItems: 'center',
    },
    noItemsText: {
        fontSize: 13,
        color: COLORS.grey,
        fontStyle: 'italic',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.darkGrey,
        textAlign: 'center',
    },
    emptySubtext: {
        marginTop: 8,
        fontSize: 14,
        color: COLORS.grey,
        textAlign: 'center',
    },
});