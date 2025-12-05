import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { COLORS } from '../../constants/themes';
import { getMonthlyCost, getCheckedItemsCount, getTopIngredientsByQuantity, getTopIngredientsByCost, getFamilyStatistics, getUserStatistics } from '../../service/statistics';
import { getMyFamily } from '../../service/family';
import { getUserProfile } from '../../service/auth';

const screenWidth = Dimensions.get('window').width;

const CHART_CONFIG = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(168, 85, 247, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
    style: {
        borderRadius: 16
    },
    propsForDots: {
        r: "6",
        strokeWidth: "2",
        stroke: "#A855F7"
    },
    propsForBackgroundLines: {
        strokeDasharray: "",
        stroke: "#E5E7EB",
        strokeWidth: 1
    },
    propsForLabels: {
        fontFamily: 'System',
        fontSize: 10,
        fontWeight: '600',
    }
};

export default function SpendingCharts() {
    const [monthlyCostData, setMonthlyCostData] = useState<any[]>([]);
    const [checkedItemsCount, setCheckedItemsCount] = useState<number>(0);
    const [topIngredientsByQuantity, setTopIngredientsByQuantity] = useState<any[]>([]);
    const [topIngredientsByCost, setTopIngredientsByCost] = useState<any[]>([]);
    const [familyStats, setFamilyStats] = useState<any>(null);
    const [userStats, setUserStats] = useState<any>(null);
    const [currentFamilyId, setCurrentFamilyId] = useState<number | null>(null);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                console.log('Fetching user profile...');
                // Get user profile to get userId
                const userProfile = await getUserProfile();
                console.log('User profile fetched:', userProfile);
                setCurrentUserId(userProfile.id);

                console.log('Fetching user families...');
                // Get user's families
                const families = await getMyFamily();
                console.log('Families fetched:', families);
                if (families && families.length > 0) {
                    // Use the first family as the current one (in a real app, user might select which family to view)
                    setCurrentFamilyId(families[0].id);
                    console.log('Family ID set:', families[0].id);
                } else {
                    console.log('No families found, using default');
                    setCurrentFamilyId(1);
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                // If there's an error, try to continue with a default family ID
                // In a real app, you might show an error message and let the user choose what to do
                setCurrentFamilyId(1);
            }
        };

        fetchUserData();
    }, []);

    useEffect(() => {
        const fetchAllData = async () => {
            if (!currentFamilyId || !currentUserId) {
                console.log('Missing familyId or userId, skipping fetch');
                return;
            }

            console.log('Fetching statistics data with:', { currentFamilyId, currentUserId });
            try {
                setLoading(true);

                // Fetch all statistics data
                const promises = [
                    getMonthlyCost(new Date().getFullYear(), currentFamilyId)
                        .then(result => {
                            console.log('getMonthlyCost result:', result);
                            return result;
                        })
                        .catch(error => {
                            console.error('getMonthlyCost error:', error);
                            return [];
                        }),
                    getCheckedItemsCount(currentFamilyId)
                        .then(result => {
                            console.log('getCheckedItemsCount result:', result);
                            return result;
                        })
                        .catch(error => {
                            console.error('getCheckedItemsCount error:', error);
                            return 0;
                        }),
                    getTopIngredientsByQuantity(currentFamilyId)
                        .then(result => {
                            console.log('getTopIngredientsByQuantity result:', result);
                            return result;
                        })
                        .catch(error => {
                            console.error('getTopIngredientsByQuantity error:', error);
                            return [];
                        }),
                    getTopIngredientsByCost(currentFamilyId)
                        .then(result => {
                            console.log('getTopIngredientsByCost result:', result);
                            return result;
                        })
                        .catch(error => {
                            console.error('getTopIngredientsByCost error:', error);
                            return [];
                        }),
                    getFamilyStatistics(currentFamilyId)
                        .then(result => {
                            console.log('getFamilyStatistics result:', result);
                            return result;
                        })
                        .catch(error => {
                            console.error('getFamilyStatistics error:', error);
                            return null;
                        }),
                    getUserStatistics(currentUserId)  // Fetch user statistics as well
                        .then(result => {
                            console.log('getUserStatistics result:', result);
                            return result;
                        })
                        .catch(error => {
                            console.error('getUserStatistics error:', error);
                            return null;
                        })
                ];

                const [monthlyCost, checkedCount, topQuantities, topCosts, familyStat, userStat] = await Promise.all(promises);

                console.log('All data fetched:', { monthlyCost, checkedCount, topQuantities, topCosts, familyStat, userStat });

                setMonthlyCostData(monthlyCost || []);
                setCheckedItemsCount(checkedCount || 0);
                setTopIngredientsByQuantity(topQuantities || []);
                setTopIngredientsByCost(topCosts || []);
                setFamilyStats(familyStat || null);
                setUserStats(userStat || null);
            } catch (error) {
                console.error('Error fetching statistics:', error);
                // Set empty defaults
                setMonthlyCostData([]);
                setCheckedItemsCount(0);
                setTopIngredientsByQuantity([]);
                setTopIngredientsByCost([]);
                setFamilyStats(null);
                setUserStats(null);
            } finally {
                setLoading(false);
                console.log('Finished fetching statistics, loading set to false');
            }
        };

        fetchAllData();
    }, [currentFamilyId, currentUserId]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.purple} />
            </View>
        );
    }

    // Prepare data for pie chart based on top ingredients by cost
    const preparePieData = () => {
        return topIngredientsByCost.slice(0, 4).map((item, index) => {
            const colors = ['#EF4444', '#10B981', '#3B82F6', '#F59E0B'];
            return {
                name: item.ingredient_name || `Nguyên liệu ${index + 1}`,
                population: item.total_cost || 0,
                color: colors[index % colors.length],
                legendFontColor: '#1F2937',
                legendFontSize: 14,
                legendFontFamily: 'System',
            };
        });
    };

    const pieData = preparePieData();

    // Prepare data for line chart based on monthly cost
    const prepareLineData = () => {
        // Create labels for all months
        const months = Array.from({ length: 12 }, (_, i) => {
            const month = i + 1;
            return `${month}/`;
        });
        
        // Create data points for each month
        const dataPoints = Array(12).fill(0);
        monthlyCostData.forEach((item) => {
            // Extract month from the month string (format: "YYYY-MM")
            const monthStr = item.month || '';
            if (monthStr.includes('-')) {
                const month = parseInt(monthStr.split('-')[1]);
                if (month >= 1 && month <= 12) {
                    dataPoints[month - 1] = Math.round(item.total_cost / 1000); // Convert to thousands for display
                }
            }
        });

        return {
            labels: months,
            datasets: [
                {
                    data: dataPoints,
                    color: (opacity = 1) => `rgba(168, 85, 247, ${opacity})`,
                    strokeWidth: 3
                }
            ],
        };
    };

    const lineData = prepareLineData();
    const data = lineData.datasets[0].data;
    const maxValue = Math.max(...data, 100); // Ensure minimum value for scaling
    const chartHeight = 220;
    const chartWidth = screenWidth - 60;

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Summary Cards */}
            <View style={styles.summaryRow}>
                <View style={[styles.summaryCard, { backgroundColor: '#F3E8FF' }]}>
                    <Text style={styles.summaryLabel}>Tổng chi tiêu</Text>
                    <Text style={styles.summaryValue}>{(familyStats?.total_cost / 1000).toFixed(0)}k đ</Text>
                    <Text style={styles.summarySubtext}>Gia đình</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: '#DBEAFE' }]}>
                    <Text style={styles.summaryLabel}>Chi tiêu cá nhân</Text>
                    <Text style={styles.summaryValue}>{(userStats?.total_cost / 1000).toFixed(0)}k đ</Text>
                    <Text style={styles.summarySubtext}>Cá nhân</Text>
                </View>
            </View>

            {/* Pie Chart */}
            <View style={styles.chartContainer}>
                <View style={styles.chartHeader}>
                    <Text style={styles.chartTitle}>Top nguyên liệu theo chi phí</Text>
                    <Text style={styles.chartSubtitle}>Theo % giá trị</Text>
                </View>
                <View style={styles.chartWrapper}>
                    {pieData.length > 0 ? (
                        <PieChart
                            data={pieData}
                            width={screenWidth - 60}
                            height={220}
                            chartConfig={CHART_CONFIG}
                            accessor={"population"}
                            backgroundColor={"transparent"}
                            paddingLeft={"15"}
                            center={[0, 0]}
                            absolute
                            hasLegend={true}
                        />
                    ) : (
                        <View style={styles.emptyChart}>
                            <Text style={styles.emptyChartText}>Không có dữ liệu</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Line Chart */}
            <View style={styles.chartContainer}>
                <View style={styles.chartHeader}>
                    <Text style={styles.chartTitle}>Chi tiêu theo tháng</Text>
                    <Text style={styles.chartSubtitle}>Đơn vị: nghìn đồng</Text>
                </View>
                <ScrollView
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    style={styles.chartScrollView}
                    contentContainerStyle={styles.chartScrollContent}
                >
                    <LineChart
                        data={lineData}
                        width={Math.max(screenWidth * 1.5, chartWidth * 1.5)} // Make the chart wider for horizontal scrolling
                        height={chartHeight}
                        chartConfig={CHART_CONFIG}
                        bezier
                        style={styles.lineChart}
                        withInnerLines={true}
                        withOuterLines={true}
                        withVerticalLabels={true}
                        withHorizontalLabels={true}
                        withDots={true}
                        withShadow={false}
                        fromZero={true}
                        segments={4}
                        formatYLabel={(value) => `${value}k`}
                        decorator={() => {
                            return lineData.datasets[0].data.map((value, index) => {
                                if (value === undefined || value === null || value === 0) return null;

                                // Calculate x position based on index and chart dimensions
                                const xPosition = (Math.max(screenWidth * 1.5, chartWidth * 1.5) - 120) / (lineData.labels.length - 1) * index + 60;
                                // Calculate y position based on value
                                const yPosition = chartHeight - 40 - ((value / maxValue) * (chartHeight - 60));

                                return (
                                    <View
                                        key={index}
                                        style={{
                                            position: 'absolute',
                                            left: xPosition - 20,
                                            top: yPosition - 30,
                                        }}
                                    >
                                        <View style={styles.valueLabel}>
                                            <Text style={styles.valueLabelText}>{value}k</Text>
                                        </View>
                                    </View>
                                );
                            });
                        }}
                    />
                </ScrollView>
                {/* Legend */}
                <View style={styles.legendContainer}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#A855F7' }]} />
                        <Text style={styles.legendText}>Chi tiêu hằng tháng</Text>
                    </View>
                </View>
            </View>

            {/* Bottom Spacing */}
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
        padding: 20,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    summaryCard: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        marginHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    summaryLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 8,
        fontWeight: '600',
    },
    summaryValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    summarySubtext: {
        fontSize: 11,
        color: '#9CA3AF',
    },
    chartContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    chartHeader: {
        marginBottom: 20,
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    chartSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    chartWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    chartScrollView: {
        // Styles for the horizontal scroll view
        flexDirection: 'row',
    },
    chartScrollContent: {
        // Make the content wider to allow scrolling
        paddingRight: 50,
    },
    lineChart: {
        borderRadius: 16,
        paddingRight: 0,
    },
    legendContainer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    legendText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '600',
    },
    valueLabel: {
        backgroundColor: '#A855F7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
        minWidth: 40,
        alignItems: 'center',
    },
    valueLabelText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    emptyChart: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        height: 200,
    },
    emptyChartText: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
    },
});