import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Dimensions,
    Image,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/themes';
import { getCachedAccess, refreshCachedAccess, CACHE_TTL } from '../utils/cachedApi';

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
    total_items?: number;
    checked_items?: number;
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
    total_cost?: number;
    price?: number;
}

export default function GroupStatistics({ familyId }: GroupStatisticsProps) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [familyStats, setFamilyStats] = useState<FamilyStats | null>(null);
    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
    const [topIngredients, setTopIngredients] = useState<TopIngredient[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [chartViewMode, setChartViewMode] = useState<'month' | 'day'>('day');
    const [shoppingLists, setShoppingLists] = useState<any[]>([]);
    const [sortMode, setSortMode] = useState<'quantity' | 'cost'>('quantity');
    const [totalIngredientCost, setTotalIngredientCost] = useState<number>(0);
    const [paidCost, setPaidCost] = useState<number>(0);
    const [remainingCost, setRemainingCost] = useState<number>(0);

    const fetchStatistics = useCallback(async (isRefreshing = false) => {
        try {
            if (isRefreshing) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            // Sử dụng cache cho các API calls
            const cacheOptions = {
                ttl: CACHE_TTL.MEDIUM,
                compareData: true,
            };

            // Fetch family statistics với cache
            let statsResponse: FamilyStatsResponse;
            if (isRefreshing) {
                const result = await refreshCachedAccess<FamilyStatsResponse>(
                    `shopping-statistics/family/${familyId}`,
                    {},
                    {
                        ...cacheOptions,
                        cacheKey: `stats:family:${familyId}`,
                    }
                );
                statsResponse = result.data;
            } else {
                const result = await getCachedAccess<FamilyStatsResponse>(
                    `shopping-statistics/family/${familyId}`,
                    {},
                    {
                        ...cacheOptions,
                        cacheKey: `stats:family:${familyId}`,
                    }
                );
                statsResponse = result.data;

                // Nếu có cache, fetch fresh data trong background
                if (result.fromCache) {
                    refreshCachedAccess<FamilyStatsResponse>(
                        `shopping-statistics/family/${familyId}`,
                        {},
                        {
                            ...cacheOptions,
                            cacheKey: `stats:family:${familyId}`,
                        }
                    ).then((freshResult) => {
                        if (freshResult.updated) {
                            const freshStats = freshResult.data;
                            let totalItems = freshStats?.total_items;
                            let checkedItems = freshStats?.checked_items;

                            if (totalItems === undefined || checkedItems === undefined) {
                                // Fallback calculation nếu cần
                                totalItems = freshStats?.purchased_items?.length || 0;
                                checkedItems = totalItems;
                            }

                            setFamilyStats({
                                total_cost: freshStats?.total_cost || 0,
                                total_items: totalItems || 0,
                                checked_items: checkedItems || 0,
                            });
                        }
                    }).catch(() => {
                        // Silently fail background refresh
                    });
                }
            }

            // Sử dụng dữ liệu từ backend nếu có, nếu không thì fallback về tính toán thủ công
            let totalItems = statsResponse?.total_items;
            let checkedItems = statsResponse?.checked_items;

            // Fetch shopping lists để tính toán theo ngày và fallback cho total_items/checked_items
            let familyLists: any[] = [];
            try {
                if (isRefreshing) {
                    const result = await refreshCachedAccess<any[]>(
                        `shopping-lists/my-family-shared/${familyId}`,
                        {},
                        {
                            ...cacheOptions,
                            cacheKey: `shopping-lists:family:${familyId}`,
                        }
                    );
                    familyLists = result.data || [];
                } else {
                    const result = await getCachedAccess<any[]>(
                        `shopping-lists/my-family-shared/${familyId}`,
                        {},
                        {
                            ...cacheOptions,
                            cacheKey: `shopping-lists:family:${familyId}`,
                        }
                    );
                    familyLists = result.data || [];
                }

                // Lưu shopping lists để tính toán theo ngày
                setShoppingLists(familyLists);

                // Tính toán tiền từ shopping lists
                let totalCost = 0;
                let paidCostValue = 0;
                let remainingCostValue = 0;

                // Nếu backend chưa trả về total_items và checked_items, tính toán từ shopping lists
                if (totalItems === undefined || checkedItems === undefined) {
                    totalItems = 0;
                    checkedItems = 0;
                }

                // Duyệt qua tất cả shopping lists và tính tổng items + tiền
                if (Array.isArray(familyLists)) {
                    familyLists.forEach((list: any) => {
                        if (Array.isArray(list.items)) {
                            list.items.forEach((item: any) => {
                                // Tính giá tiền: (price/kg * stock/gram) / 1000
                                const price = Number(item.price) || Number(item.ingredient?.price) || 0;
                                const stock = Number(item.stock) || 0;
                                const itemCost = (price * stock) / 1000;

                                totalCost += itemCost;

                                if (item.is_checked) {
                                    paidCostValue += itemCost;
                                } else {
                                    remainingCostValue += itemCost;
                                }
                            });

                            // Tính tổng items nếu cần
                            if (totalItems === undefined || checkedItems === undefined) {
                                totalItems += list.items.length;
                                checkedItems += list.items.filter((item: any) => item.is_checked).length;
                            }
                        }
                    });
                }

                setTotalIngredientCost(Math.round(totalCost));
                setPaidCost(Math.round(paidCostValue));
                setRemainingCost(Math.round(remainingCostValue));
            } catch (e) {
                // Fallback: sử dụng getCheckedItemsCount với cache
                try {
                    let checkedData;
                    if (isRefreshing) {
                        const result = await refreshCachedAccess<any>(
                            `shopping-statistics/checked-items`,
                            { familyId },
                            {
                                ...cacheOptions,
                                cacheKey: `checked-items:family:${familyId}`,
                            }
                        );
                        checkedData = result.data;
                    } else {
                        const result = await getCachedAccess<any>(
                            `shopping-statistics/checked-items`,
                            { familyId },
                            {
                                ...cacheOptions,
                                cacheKey: `checked-items:family:${familyId}`,
                            }
                        );
                        checkedData = result.data;
                    }
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
                total_items: totalItems || 0,
                checked_items: checkedItems || 0,
            });

            // Fetch monthly cost for current year and previous year để có đủ 7 tháng gần nhất
            const currentYear = new Date().getFullYear();
            const previousYear = currentYear - 1;
            try {
                let monthlyCurrent: MonthlyData[] = [];
                let monthlyPrevious: MonthlyData[] = [];
                
                // Fetch năm hiện tại
                if (isRefreshing) {
                    const resultCurrent = await refreshCachedAccess<MonthlyData[]>(
                        `shopping-statistics/monthly-cost`,
                        { year: currentYear, familyId },
                        {
                            ...cacheOptions,
                            cacheKey: `monthly-cost:${currentYear}:family:${familyId}`,
                        }
                    );
                    monthlyCurrent = resultCurrent.data || [];
                    
                    // Fetch năm trước
                    const resultPrevious = await refreshCachedAccess<MonthlyData[]>(
                        `shopping-statistics/monthly-cost`,
                        { year: previousYear, familyId },
                        {
                            ...cacheOptions,
                            cacheKey: `monthly-cost:${previousYear}:family:${familyId}`,
                        }
                    );
                    monthlyPrevious = resultPrevious.data || [];
                } else {
                    const resultCurrent = await getCachedAccess<MonthlyData[]>(
                        `shopping-statistics/monthly-cost`,
                        { year: currentYear, familyId },
                        {
                            ...cacheOptions,
                            cacheKey: `monthly-cost:${currentYear}:family:${familyId}`,
                        }
                    );
                    monthlyCurrent = resultCurrent.data || [];
                    
                    // Fetch năm trước
                    const resultPrevious = await getCachedAccess<MonthlyData[]>(
                        `shopping-statistics/monthly-cost`,
                        { year: previousYear, familyId },
                        {
                            ...cacheOptions,
                            cacheKey: `monthly-cost:${previousYear}:family:${familyId}`,
                        }
                    );
                    monthlyPrevious = resultPrevious.data || [];
                }
                
                // Merge dữ liệu từ cả 2 năm và sắp xếp theo tháng
                const mergedMonthly = [...monthlyPrevious, ...monthlyCurrent].sort((a, b) => 
                    a.month.localeCompare(b.month)
                );
                
                setMonthlyData(mergedMonthly);
            } catch (e) {
                setMonthlyData([]);
            }

            // Fetch top ingredients với cache
            try {
                let topIng;
                if (isRefreshing) {
                    const result = await refreshCachedAccess<TopIngredient[]>(
                        `shopping-statistics/top-ingredients`,
                        { familyId, limit: 5 },
                        {
                            ...cacheOptions,
                            cacheKey: `top-ingredients:family:${familyId}:limit:5`,
                        }
                    );
                    topIng = result.data;
                } else {
                    const result = await getCachedAccess<TopIngredient[]>(
                        `shopping-statistics/top-ingredients`,
                        { familyId, limit: 5 },
                        {
                            ...cacheOptions,
                            cacheKey: `top-ingredients:family:${familyId}:limit:5`,
                        }
                    );
                    topIng = result.data;
                }
                // Debug: log để kiểm tra dữ liệu từ backend
                if (topIng && topIng.length > 0) {
                    console.log('Top ingredients data:', topIng.map(item => ({
                        name: item.ingredient_name,
                        quantity: item.total_quantity,
                        cost: item.total_cost
                    })));
                }
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

    // Refresh statistics when tab is focused (user navigates back to statistics tab)
    useFocusEffect(
        useCallback(() => {
            // Refresh statistics when user comes back to this tab
            fetchStatistics(true);
        }, [fetchStatistics])
    );

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

    // Prepare daily chart data from shopping lists
    const prepareDailyChartData = () => {
        if (!shoppingLists || shoppingLists.length === 0) {
            return null;
        }

        // Group by date
        const dailyMap = new Map<string, number>();
        
        shoppingLists.forEach((list: any) => {
            if (list.shopping_date && list.cost) {
                const date = new Date(list.shopping_date);
                const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
                const cost = Number(list.cost) || 0;
                
                if (dailyMap.has(dateKey)) {
                    dailyMap.set(dateKey, dailyMap.get(dateKey)! + cost);
                } else {
                    dailyMap.set(dateKey, cost);
                }
            }
        });

        // Sort by date and get last 7 days or all if less than 7
        const sortedEntries = Array.from(dailyMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-7); // Last 7 days

        if (sortedEntries.length === 0) {
            return null;
        }

        const labels = sortedEntries.map(([date]) => {
            const d = new Date(date);
            return `${d.getDate()}/${d.getMonth() + 1}`;
        });

        const data = sortedEntries.map(([, cost]) =>
            Math.round(cost / 1000) || 0
        );

        return { labels, data };
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

        // Get last 7 months
        const last7Months = monthlyData.slice(-7);

        const labels = last7Months.map(item => {
            const month = item.month.split('-')[1];
            return monthNames[month] || month;
        });

        const data = last7Months.map(item =>
            Math.round(Number(item.total_cost) / 1000) || 0
        );

        return { labels, data };
    };

    const chartData = chartViewMode === 'day' 
        ? prepareDailyChartData() 
        : prepareMonthlyChartData();

    // Sort top ingredients based on sort mode
    const sortedTopIngredients = [...topIngredients].sort((a, b) => {
        if (sortMode === 'quantity') {
            return b.total_quantity - a.total_quantity;
        } else {
            const costA = a.total_cost || 0;
            const costB = b.total_cost || 0;
            return costB - costA;
        }
    });

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
                {/* Total Ingredient Cost Card */}
                <View style={[styles.summaryCard, styles.summaryCardPurple]}>
                    <View style={styles.summaryIconContainer}>
                        <Ionicons name="wallet-outline" size={24} color="#7C3AED" />
                    </View>
                    <Text style={styles.summaryLabel}>Tổng tiền nguyên liệu</Text>
                    <Text style={styles.summaryValue}>
                        {formatCurrency(totalIngredientCost)}
                    </Text>
                </View>

                {/* Paid Cost Card */}
                <View style={[styles.summaryCard, styles.summaryCardGreen]}>
                    <View style={styles.summaryIconContainer}>
                        <Ionicons name="checkmark-circle-outline" size={24} color="#10B981" />
                    </View>
                    <Text style={styles.summaryLabel}>Tiền đã chi</Text>
                    <Text style={styles.summaryValue}>
                        {formatCurrency(paidCost)}
                    </Text>
                </View>
            </View>

            <View style={styles.summaryRow}>
                {/* Remaining Cost Card */}
                <View style={[styles.summaryCard, styles.summaryCardOrange]}>
                    <View style={styles.summaryIconContainer}>
                        <Ionicons name="hourglass-outline" size={24} color="#F59E0B" />
                    </View>
                    <Text style={styles.summaryLabel}>Tiền cần chi</Text>
                    <Text style={styles.summaryValue}>
                        {formatCurrency(remainingCost)}
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

            {/* Monthly/Daily Chart */}
            <View style={styles.chartContainer}>
                <View style={styles.chartHeader}>
                    <Text style={styles.sectionTitle}>
                        Chi tiêu theo {chartViewMode === 'day' ? 'ngày' : 'tháng'}
                    </Text>
                    <View style={styles.toggleContainer}>
                        <TouchableOpacity
                            style={[
                                styles.toggleButton,
                                chartViewMode === 'day' && styles.toggleButtonActive
                            ]}
                            onPress={() => setChartViewMode('day')}
                        >
                            <Text style={[
                                styles.toggleButtonText,
                                chartViewMode === 'day' && styles.toggleButtonTextActive
                            ]}>
                                Ngày
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.toggleButton,
                                chartViewMode === 'month' && styles.toggleButtonActive
                            ]}
                            onPress={() => setChartViewMode('month')}
                        >
                            <Text style={[
                                styles.toggleButtonText,
                                chartViewMode === 'month' && styles.toggleButtonTextActive
                            ]}>
                                Tháng
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <Text style={styles.sectionSubtitle}>Đơn vị: nghìn đồng (k)</Text>

                {chartData && chartData.data.some(v => v > 0) ? (
                    <View style={styles.chartWrapper}>
                        <BarChart
                            data={{
                                labels: chartData.labels,
                                datasets: [{ data: chartData.data }],
                            }}
                            width={screenWidth - 92}
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
                    </View>
                ) : (
                    <View style={styles.emptyChart}>
                        <Ionicons name="bar-chart-outline" size={48} color={COLORS.grey} />
                        <Text style={styles.emptyText}>Chưa có dữ liệu chi tiêu</Text>
                    </View>
                )}
            </View>

            {/* Top Ingredients */}
            <View style={styles.ingredientsContainer}>
                <View style={styles.ingredientsHeader}>
                    <Text style={styles.sectionTitle}>Top nguyên liệu mua nhiều</Text>
                    <View style={styles.sortToggleContainer}>
                        <TouchableOpacity
                            style={[
                                styles.sortToggleButton,
                                sortMode === 'quantity' && styles.sortToggleButtonActive
                            ]}
                            onPress={() => setSortMode('quantity')}
                        >
                            <Text style={[
                                styles.sortToggleButtonText,
                                sortMode === 'quantity' && styles.sortToggleButtonTextActive
                            ]}>
                                Số lượng
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.sortToggleButton,
                                sortMode === 'cost' && styles.sortToggleButtonActive
                            ]}
                            onPress={() => setSortMode('cost')}
                        >
                            <Text style={[
                                styles.sortToggleButtonText,
                                sortMode === 'cost' && styles.sortToggleButtonTextActive
                            ]}>
                                Số tiền
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <Text style={styles.sectionSubtitle}>
                    {sortMode === 'quantity' ? 'Theo số lượng (gram)' : 'Theo số tiền đã mua'}
                </Text>

                {sortedTopIngredients.length > 0 ? (
                    <View style={styles.ingredientsList}>
                        {sortedTopIngredients.map((item, index) => (
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

                                <View style={styles.ingredientCostContainer}>
                                    {item.total_cost !== undefined && item.total_cost !== null && item.total_cost > 0 ? (
                                        <Text style={styles.ingredientCost}>
                                            {formatCurrency(Math.round(item.total_cost))}
                                        </Text>
                                    ) : (
                                        <Text style={[styles.ingredientCost, { color: COLORS.grey, fontSize: 12 }]}>
                                            Chưa có giá
                                        </Text>
                                    )}
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
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        flex: 1,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 2,
        gap: 2,
    },
    toggleButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    toggleButtonActive: {
        backgroundColor: COLORS.purple,
    },
    toggleButtonText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6B7280',
    },
    toggleButtonTextActive: {
        color: COLORS.white,
        fontWeight: '600',
    },
    sectionSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 16,
    },
    chartWrapper: {
        overflow: 'hidden',
        marginLeft: -6,
        marginRight: -10,
    },
    chart: {
        borderRadius: 12,
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
    ingredientsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    sortToggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 2,
        gap: 2,
    },
    sortToggleButton: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    sortToggleButtonActive: {
        backgroundColor: COLORS.purple,
    },
    sortToggleButtonText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#6B7280',
    },
    sortToggleButtonTextActive: {
        color: COLORS.white,
        fontWeight: '600',
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
    ingredientCostContainer: {
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    ingredientCost: {
        fontSize: 13,
        color: '#10B981',
        fontWeight: '600',
        textAlign: 'right',
    },
    emptyIngredients: {
        paddingVertical: 40,
        alignItems: 'center',
        gap: 12,
    },
});
