import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Dimensions,
    Image,
    RefreshControl,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/themes';
import {
    getFamilyStatistics,
    getMonthlyCost,
    getTopIngredientsByQuantity,
    getCheckedItemsCount,
    getFamilyShoppingLists,
} from '../service/statistics';

const screenWidth = Dimensions.get('window').width;

interface GroupStatisticsProps {
    familyId: number;
}

interface PurchasedItem {
    id: number;
    ingredient_id: number;
    stock: number;
    price: string;
    is_checked: boolean;
    ingredient?: {
        id: number;
        name: string;
        image_url?: string;
    };
}

interface FamilyStatsResponse {
    total_cost: number;
    purchased_items: PurchasedItem[];
}

interface FamilyStats {
    total_cost: number;
    total_items: number;
    checked_items: number;
}

interface MonthlyData {
    month: string;
    total_cost: number;
}

interface TopIngredient {
    ingredient_id: number;
    ingredient_name: string;
    ingredient_image?: string;
    total_quantity: number;
    price?: number;
}

export default function GroupStatistics({ familyId }: GroupStatisticsProps) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [familyStats, setFamilyStats] = useState<FamilyStats | null>(null);
    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
    const [topIngredients, setTopIngredients] = useState<TopIngredient[]>([]);
    const [error, setError] = useState<string | null>(null);

    const fetchStatistics = useCallback(async (isRefreshing = false) => {
        try {
            if (isRefreshing) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            // Fetch family statistics (total_cost và purchased_items - đã mua)
            const statsResponse: FamilyStatsResponse = await getFamilyStatistics(familyId);

            // Fetch family shopping lists để tính tổng items và items đã check
            let totalItems = 0;
            let checkedItems = 0;

            try {
                const familyLists = await getFamilyShoppingLists(familyId);
                // Duyệt qua tất cả shopping lists và tính tổng items
                if (Array.isArray(familyLists)) {
                    familyLists.forEach((list: any) => {
                        if (Array.isArray(list.items)) {
                            totalItems += list.items.length;
                            checkedItems += list.items.filter((item: any) => item.is_checked).length;
                        }
                    });
                }
            } catch (e) {
                // Fallback: sử dụng getCheckedItemsCount
                try {
                    const checkedData = await getCheckedItemsCount(familyId);
                    checkedItems = checkedData?.total || 0;
                    totalItems = checkedItems; // Không có thông tin total, dùng checked làm fallback
                } catch (e2) {
                    // Fallback cuối cùng: dùng purchased_items từ statsResponse
                    checkedItems = statsResponse?.purchased_items?.length || 0;
                    totalItems = checkedItems;
                }
            }

            // Tính toán và set familyStats
            setFamilyStats({
                total_cost: statsResponse?.total_cost || 0,
                total_items: totalItems,
                checked_items: checkedItems,
            });

            // Fetch monthly cost for current year
            const currentYear = new Date().getFullYear();
            try {
                const monthly = await getMonthlyCost(currentYear, familyId);
                setMonthlyData(monthly || []);
            } catch (e) {
                setMonthlyData([]);
            }

            // Fetch top ingredients
            try {
                const topIng = await getTopIngredientsByQuantity(familyId, 5);
                setTopIngredients(topIng || []);
            } catch (e) {
                setTopIngredients([]);
            }
        } catch (err: any) {
            setError('Không thể tải thống kê. Vui lòng thử lại.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [familyId]);

    useEffect(() => {
        fetchStatistics();
    }, [fetchStatistics]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    const getCompletionRate = () => {
        if (!familyStats || familyStats.total_items === 0) return 0;
        return Math.round((familyStats.checked_items / familyStats.total_items) * 100);
    };

    // Prepare monthly chart data
    const prepareMonthlyChartData = () => {
        if (monthlyData.length === 0) {
            return null;
        }

        const monthNames: { [key: string]: string } = {
            '01': 'T1', '02': 'T2', '03': 'T3', '04': 'T4',
            '05': 'T5', '06': 'T6', '07': 'T7', '08': 'T8',
            '09': 'T9', '10': 'T10', '11': 'T11', '12': 'T12',
        };

        const labels = monthlyData.map(item => {
            const month = item.month.split('-')[1];
            return monthNames[month] || month;
        });

        const data = monthlyData.map(item =>
            Math.round(Number(item.total_cost) / 1000) || 0
        );

        return { labels, data };
    };

    const chartData = prepareMonthlyChartData();

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.purple} />
                <Text style={styles.loadingText}>Đang tải thống kê...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={48} color={COLORS.grey} />
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => fetchStatistics(true)}
                    colors={[COLORS.purple]}
                    tintColor={COLORS.purple}
                />
            }
        >
            {/* Summary Cards */}
            <View style={styles.summaryRow}>
                {/* Total Cost Card */}
                <View style={[styles.summaryCard, styles.summaryCardPurple]}>
                    <View style={styles.summaryIconContainer}>
                        <Ionicons name="wallet-outline" size={24} color="#7C3AED" />
                    </View>
                    <Text style={styles.summaryLabel}>Tổng chi tiêu</Text>
                    <Text style={styles.summaryValue}>
                        {familyStats ? formatCurrency(familyStats.total_cost) : '0đ'}
                    </Text>
                </View>

                {/* Total Items Card */}
                <View style={[styles.summaryCard, styles.summaryCardBlue]}>
                    <View style={styles.summaryIconContainer}>
                        <Ionicons name="cart-outline" size={24} color="#3B82F6" />
                    </View>
                    <Text style={styles.summaryLabel}>Tổng mặt hàng</Text>
                    <Text style={styles.summaryValue}>
                        {familyStats?.total_items || 0}
                    </Text>
                </View>
            </View>

            <View style={styles.summaryRow}>
                {/* Checked Items Card */}
                <View style={[styles.summaryCard, styles.summaryCardGreen]}>
                    <View style={styles.summaryIconContainer}>
                        <Ionicons name="checkmark-circle-outline" size={24} color="#10B981" />
                    </View>
                    <Text style={styles.summaryLabel}>Đã mua</Text>
                    <Text style={styles.summaryValue}>
                        {familyStats?.checked_items || 0}
                    </Text>
                </View>

                {/* Completion Rate Card */}
                <View style={[styles.summaryCard, styles.summaryCardOrange]}>
                    <View style={styles.summaryIconContainer}>
                        <Ionicons name="pie-chart-outline" size={24} color="#F59E0B" />
                    </View>
                    <Text style={styles.summaryLabel}>Tỷ lệ hoàn thành</Text>
                    <Text style={styles.summaryValue}>{getCompletionRate()}%</Text>
                </View>
            </View>

            {/* Monthly Chart */}
            <View style={styles.chartContainer}>
                <Text style={styles.sectionTitle}>Chi tiêu theo tháng</Text>
                <Text style={styles.sectionSubtitle}>Đơn vị: nghìn đồng (k)</Text>

                {chartData && chartData.data.some(v => v > 0) ? (
                    <BarChart
                        data={{
                            labels: chartData.labels,
                            datasets: [{ data: chartData.data }],
                        }}
                        width={screenWidth - 72}
                        height={200}
                        yAxisLabel=""
                        yAxisSuffix="k"
                        chartConfig={{
                            backgroundColor: '#ffffff',
                            backgroundGradientFrom: '#ffffff',
                            backgroundGradientTo: '#ffffff',
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(124, 58, 237, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
                            style: { borderRadius: 16 },
                            barPercentage: 0.6,
                        }}
                        style={styles.chart}
                        fromZero
                        showValuesOnTopOfBars
                    />
                ) : (
                    <View style={styles.emptyChart}>
                        <Ionicons name="bar-chart-outline" size={48} color={COLORS.grey} />
                        <Text style={styles.emptyText}>Chưa có dữ liệu chi tiêu</Text>
                    </View>
                )}
            </View>

            {/* Top Ingredients */}
            <View style={styles.ingredientsContainer}>
                <Text style={styles.sectionTitle}>Top nguyên liệu mua nhiều</Text>
                <Text style={styles.sectionSubtitle}>Theo số lượng (gram)</Text>

                {topIngredients.length > 0 ? (
                    <View style={styles.ingredientsList}>
                        {topIngredients.map((item, index) => (
                            <View key={item.ingredient_id} style={styles.ingredientItem}>
                                <View style={styles.ingredientRank}>
                                    <Text style={styles.ingredientRankText}>{index + 1}</Text>
                                </View>

                                {item.ingredient_image ? (
                                    <Image
                                        source={{ uri: item.ingredient_image }}
                                        style={styles.ingredientImage}
                                    />
                                ) : (
                                    <View style={styles.ingredientImagePlaceholder}>
                                        <Ionicons name="nutrition-outline" size={20} color={COLORS.purple} />
                                    </View>
                                )}

                                <View style={styles.ingredientInfo}>
                                    <Text style={styles.ingredientName} numberOfLines={1}>
                                        {item.ingredient_name}
                                    </Text>
                                    <Text style={styles.ingredientQuantity}>
                                        {item.total_quantity.toLocaleString()}g
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyIngredients}>
                        <Ionicons name="nutrition-outline" size={48} color={COLORS.grey} />
                        <Text style={styles.emptyText}>Chưa có dữ liệu nguyên liệu</Text>
                    </View>
                )}
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    contentContainer: {
        padding: 16,
        gap: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        gap: 12,
    },
    loadingText: {
        color: COLORS.grey,
        fontSize: 14,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        gap: 12,
        padding: 20,
    },
    errorText: {
        color: COLORS.grey,
        fontSize: 14,
        textAlign: 'center',
    },
    summaryRow: {
        flexDirection: 'row',
        gap: 12,
    },
    summaryCard: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    summaryCardPurple: {
        backgroundColor: '#F3E8FF',
    },
    summaryCardBlue: {
        backgroundColor: '#DBEAFE',
    },
    summaryCardGreen: {
        backgroundColor: '#D1FAE5',
    },
    summaryCardOrange: {
        backgroundColor: '#FEF3C7',
    },
    summaryIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    chartContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 16,
    },
    chart: {
        borderRadius: 12,
        marginLeft: -10,
    },
    emptyChart: {
        paddingVertical: 40,
        alignItems: 'center',
        gap: 12,
    },
    emptyText: {
        color: COLORS.grey,
        fontSize: 14,
    },
    ingredientsContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    ingredientsList: {
        gap: 12,
    },
    ingredientItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
    },
    ingredientRank: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.purple,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ingredientRankText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 14,
    },
    ingredientImage: {
        width: 44,
        height: 44,
        borderRadius: 8,
    },
    ingredientImagePlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: '#F3E8FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    ingredientInfo: {
        flex: 1,
    },
    ingredientName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
    },
    ingredientQuantity: {
        fontSize: 13,
        color: COLORS.purple,
        fontWeight: '500',
        marginTop: 2,
    },
    emptyIngredients: {
        paddingVertical: 40,
        alignItems: 'center',
        gap: 12,
    },
});
