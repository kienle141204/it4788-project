import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { COLORS } from '../../constants/themes';
import { getMyShoppingLists } from '../../service/statistics';
import { Ionicons } from '@expo/vector-icons';

interface ShoppingList {
    id: number;
    cost: number;
    shopping_date: string;
    is_shared: boolean;
    items?: any[];
}

export default function ShoppingHistory() {
    const [myLists, setMyLists] = useState<ShoppingList[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCost, setTotalCost] = useState(0);

    useEffect(() => {
        const fetchMyLists = async () => {
            try {
                setLoading(true);
                console.log('Fetching my shopping lists...');
                const lists = await getMyShoppingLists();
                console.log('My shopping lists:', lists);
                setMyLists(lists || []);

                // Calculate total cost - ensure proper number conversion
                const total = lists?.reduce((sum: number, list: ShoppingList) => {
                    const cost = Number(list.cost) || 0;
                    return sum + cost;
                }, 0) || 0;
                setTotalCost(Math.round(total));
            } catch (error) {
                console.error('Error fetching my shopping lists:', error);
                setMyLists([]);
                setTotalCost(0);
            } finally {
                setLoading(false);
            }
        };

        fetchMyLists();
    }, []);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const renderItem = ({ item }: { item: ShoppingList }) => (
        <View style={styles.listCard}>
            <View style={styles.iconContainer}>
                <Ionicons name="cart" size={24} color={COLORS.purple} />
            </View>
            <View style={styles.listInfo}>
                <Text style={styles.listDate}>{formatDate(item.shopping_date)}</Text>
                <View style={styles.listMeta}>
                    <Text style={styles.itemCount}>
                        {item.items?.length || 0} sản phẩm
                    </Text>
                    {item.is_shared && (
                        <View style={styles.sharedBadge}>
                            <Ionicons name="people" size={12} color={COLORS.purple} />
                            <Text style={styles.sharedText}>Chia sẻ</Text>
                        </View>
                    )}
                </View>
            </View>
            <View style={styles.costContainer}>
                <Text style={styles.costText}>{formatCurrency(item.cost || 0)}</Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.purple} />
                <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Summary Card */}
            <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Tổng chi tiêu cá nhân</Text>
                <Text style={styles.summaryValue}>{formatCurrency(totalCost)}</Text>
                <Text style={styles.summarySubtext}>{myLists.length} danh sách mua sắm</Text>
            </View>

            {/* Shopping Lists */}
            <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>Lịch sử mua sắm</Text>
                {myLists.length > 0 ? (
                    <FlatList
                        data={myLists}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id.toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContent}
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="cart-outline" size={64} color={COLORS.grey} />
                        <Text style={styles.emptyText}>Chưa có danh sách mua sắm nào</Text>
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
        padding: 20,
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
    summaryCard: {
        backgroundColor: '#DBEAFE',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 8,
        fontWeight: '600',
    },
    summaryValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    summarySubtext: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    listSection: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.darkGrey,
        marginBottom: 16,
    },
    listContent: {
        paddingBottom: 20,
    },
    listCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F3E8FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    listInfo: {
        flex: 1,
    },
    listDate: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.darkGrey,
        marginBottom: 4,
    },
    listMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemCount: {
        fontSize: 14,
        color: COLORS.grey,
        marginRight: 8,
    },
    sharedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3E8FF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    sharedText: {
        fontSize: 11,
        color: COLORS.purple,
        marginLeft: 4,
        fontWeight: '600',
    },
    costContainer: {
        alignItems: 'flex-end',
    },
    costText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.purple,
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
        color: COLORS.grey,
        textAlign: 'center',
    },
});