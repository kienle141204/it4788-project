import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { COLORS } from '../../constants/themes';
import { getMyShoppingLists } from '../../service/statistics';
import { Ionicons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

interface ShoppingList {
    id: number;
    cost: number;
    shopping_date: string;
    is_shared: boolean;
    items?: any[];
}

export default function SpendingCharts() {
    const [myLists, setMyLists] = useState<ShoppingList[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCost, setTotalCost] = useState(0);
    const [monthlyData, setMonthlyData] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] });

    useEffect(() => {
        const fetchMyLists = async () => {
            try {
                setLoading(true);
                const lists = await getMyShoppingLists();
                setMyLists(lists || []);

                // Calculate total cost
                const total = lists?.reduce((sum: number, list: ShoppingList) => {
                    const cost = Number(list.cost) || 0;
                    return sum + cost;
                }, 0) || 0;
                setTotalCost(Math.round(total));

                // Calculate monthly data
                calculateMonthlyData(lists || []);
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

    const calculateMonthlyData = (lists: ShoppingList[]) => {
        const monthNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
        const monthlyTotals = new Array(12).fill(0);

        lists.forEach(list => {
            if (list.shopping_date) {
                const date = new Date(list.shopping_date);
                const month = date.getMonth();
                monthlyTotals[month] += Number(list.cost) || 0;
            }
        });

        // Get last 6 months with data or current 6 months
        const currentMonth = new Date().getMonth();
        const labels: string[] = [];
        const data: number[] = [];

        for (let i = 5; i >= 0; i--) {
            const monthIndex = (currentMonth - i + 12) % 12;
            labels.push(monthNames[monthIndex]);
            data.push(Math.round(monthlyTotals[monthIndex] / 1000)); // Convert to thousands
        }

        setMonthlyData({ labels, data });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    };

    // Prepare pie chart data - top 5 shopping lists by cost
    const preparePieData = () => {
        console.log('Preparing pie data, myLists:', myLists);
        if (!myLists || myLists.length === 0) return [];

        const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#A855F7'];

        const sortedLists = [...myLists]
            .filter(list => Number(list.cost) > 0)
            .sort((a, b) => Number(b.cost) - Number(a.cost))
            .slice(0, 5);

        console.log('Sorted lists for pie:', sortedLists);

        const result = sortedLists.map((list, index) => ({
            name: formatDate(list.shopping_date),
            population: Number(list.cost) || 1,
            color: colors[index % colors.length],
            legendFontColor: '#1F2937',
            legendFontSize: 12,
        }));

        console.log('Pie chart data:', result);
        return result;
    };

    const pieData = preparePieData();

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.purple} />
                <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Summary Card */}
            <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                    <Ionicons name="wallet" size={28} color="#3B82F6" />
                    <Text style={styles.summaryLabel}>Tổng chi tiêu cá nhân</Text>
                </View>
                <Text style={styles.summaryValue}>{formatCurrency(totalCost)}</Text>
                <Text style={styles.summarySubtext}>{myLists.length} danh sách mua sắm</Text>
            </View>

            {/* Monthly Bar Chart */}
            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Chi tiêu theo tháng</Text>
                <Text style={styles.chartSubtitle}>Đơn vị: nghìn đồng (k)</Text>

                {monthlyData.data.some(v => v > 0) ? (
                    <BarChart
                        data={{
                            labels: monthlyData.labels,
                            datasets: [{ data: monthlyData.data.map(v => v || 0) }]
                        }}
                        width={screenWidth - 60}
                        height={200}
                        yAxisLabel=""
                        yAxisSuffix="k"
                        chartConfig={{
                            backgroundColor: '#ffffff',
                            backgroundGradientFrom: '#ffffff',
                            backgroundGradientTo: '#ffffff',
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(22, 163, 74, ${opacity})`,
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
                        <Text style={styles.emptyText}>Chưa có dữ liệu</Text>
                    </View>
                )}
            </View>

            {/* Pie Chart */}
            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Top 5 chi tiêu lớn nhất</Text>
                <Text style={styles.chartSubtitle}>Theo ngày mua sắm</Text>

                {pieData.length > 0 ? (
                    <PieChart
                        data={pieData}
                        width={screenWidth - 60}
                        height={200}
                        chartConfig={{
                            backgroundColor: '#ffffff',
                            backgroundGradientFrom: '#ffffff',
                            backgroundGradientTo: '#ffffff',
                            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        }}
                        accessor="population"
                        backgroundColor="transparent"
                        paddingLeft="15"
                        center={[0, 0]}
                        hasLegend={true}
                        absolute
                    />
                ) : (
                    <View style={styles.emptyChart}>
                        <Ionicons name="pie-chart-outline" size={48} color={COLORS.grey} />
                        <Text style={styles.emptyText}>Chưa có dữ liệu</Text>
                    </View>
                )}
            </View>

            <View style={{ height: 20 }} />
        </ScrollView>
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
        color: COLORS.grey,
    },
    summaryCard: {
        backgroundColor: '#DBEAFE',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#1F2937',
        marginLeft: 8,
        fontWeight: '600',
    },
    summaryValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    summarySubtext: {
        fontSize: 12,
        color: '#6B7280',
    },
    chartContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    chartSubtitle: {
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
    },
    emptyText: {
        marginTop: 12,
        color: COLORS.grey,
    },
});