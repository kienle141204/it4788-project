import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../../constants/themes';
import { getMonthlyCost, getCheckedItemsCount, getTopIngredientsByQuantity, getTopIngredientsByCost, getFamilyStatistics, getUserStatistics } from '../../service/statistics';
import { getMyFamily } from '../../service/family';
import { getUserProfile } from '../../service/auth';
import TopIngredients from './TopIngredients';

export default function DetailedStats() {
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
                console.log('DetailedStats: Fetching user profile...');
                // Get user profile to get userId
                const userProfile = await getUserProfile();
                console.log('DetailedStats: User profile fetched:', userProfile);
                setCurrentUserId(userProfile.id);

                console.log('DetailedStats: Fetching user families...');
                // Get user's families
                const families = await getMyFamily();
                console.log('DetailedStats: Families fetched:', families);
                if (families && families.length > 0) {
                    // Use the first family as the current one (in a real app, user might select which family to view)
                    setCurrentFamilyId(families[0].id);
                    console.log('DetailedStats: Family ID set:', families[0].id);
                } else {
                    console.log('DetailedStats: No families found, using default');
                    setCurrentFamilyId(1);
                }
            } catch (error) {
                console.error('DetailedStats: Error fetching user data:', error);
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
                console.log('DetailedStats: Missing familyId or userId, skipping fetch');
                return;
            }

            console.log('DetailedStats: Fetching statistics data with:', { currentFamilyId, currentUserId });
            try {
                setLoading(true);

                // Fetch all statistics data
                const promises = [
                    getMonthlyCost(new Date().getFullYear(), currentFamilyId)
                        .then(result => {
                            console.log('DetailedStats getMonthlyCost result:', result);
                            return result;
                        })
                        .catch(error => {
                            console.error('DetailedStats getMonthlyCost error:', error);
                            return [];
                        }),
                    getCheckedItemsCount(currentFamilyId)
                        .then(result => {
                            console.log('DetailedStats getCheckedItemsCount result:', result);
                            return result;
                        })
                        .catch(error => {
                            console.error('DetailedStats getCheckedItemsCount error:', error);
                            return 0;
                        }),
                    getTopIngredientsByQuantity(currentFamilyId)
                        .then(result => {
                            console.log('DetailedStats getTopIngredientsByQuantity result:', result);
                            return result;
                        })
                        .catch(error => {
                            console.error('DetailedStats getTopIngredientsByQuantity error:', error);
                            return [];
                        }),
                    getTopIngredientsByCost(currentFamilyId)
                        .then(result => {
                            console.log('DetailedStats getTopIngredientsByCost result:', result);
                            return result;
                        })
                        .catch(error => {
                            console.error('DetailedStats getTopIngredientsByCost error:', error);
                            return [];
                        }),
                    getFamilyStatistics(currentFamilyId)
                        .then(result => {
                            console.log('DetailedStats getFamilyStatistics result:', result);
                            return result;
                        })
                        .catch(error => {
                            console.error('DetailedStats getFamilyStatistics error:', error);
                            return null;
                        }),
                    getUserStatistics(currentUserId)  // Fetch user statistics as well
                        .then(result => {
                            console.log('DetailedStats getUserStatistics result:', result);
                            return result;
                        })
                        .catch(error => {
                            console.error('DetailedStats getUserStatistics error:', error);
                            return null;
                        })
                ];

                const [monthlyCost, checkedCount, topQuantities, topCosts, familyStat, userStat] = await Promise.all(promises);

                console.log('DetailedStats: All data fetched:', { monthlyCost, checkedCount, topQuantities, topCosts, familyStat, userStat });

                setMonthlyCostData(monthlyCost || []);
                setCheckedItemsCount(checkedCount || 0);
                setTopIngredientsByQuantity(topQuantities || []);
                setTopIngredientsByCost(topCosts || []);
                setFamilyStats(familyStat || null);
                setUserStats(userStat || null);
            } catch (error) {
                console.error('DetailedStats: Error fetching statistics:', error);
                // Set empty defaults
                setMonthlyCostData([]);
                setCheckedItemsCount(0);
                setTopIngredientsByQuantity([]);
                setTopIngredientsByCost([]);
                setFamilyStats(null);
                setUserStats(null);
            } finally {
                setLoading(false);
                console.log('DetailedStats: Finished fetching statistics, loading set to false');
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

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* User Summary Cards */}
            {userStats && (
                <View style={styles.summarySection}>
                    <Text style={styles.sectionTitle}>Thống kê cá nhân</Text>
                    <View style={styles.summaryRow}>
                        <View style={[styles.summaryCard, { backgroundColor: '#F3E8FF' }]}>
                            <Text style={styles.summaryLabel}>Chi tiêu cá nhân</Text>
                            <Text style={styles.summaryValue}>{(userStats?.total_cost / 1000).toFixed(0)}k</Text>
                            <Text style={styles.summarySubtext}>Tất cả thời gian</Text>
                        </View>
                        <View style={[styles.summaryCard, { backgroundColor: '#DCFCE7' }]}>
                            <Text style={styles.summaryLabel}>Sản phẩm cá nhân</Text>
                            <Text style={styles.summaryValue}>{userStats?.total_items}</Text>
                            <Text style={styles.summarySubtext}>Đã mua</Text>
                        </View>
                        <View style={[styles.summaryCard, { backgroundColor: '#DBEAFE' }]}>
                            <Text style={styles.summaryLabel}>Đã check</Text>
                            <Text style={styles.summaryValue}>{userStats?.checked_items}</Text>
                            <Text style={styles.summarySubtext}>Sản phẩm</Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Family Summary Cards */}
            <View style={styles.summarySection}>
                <Text style={styles.sectionTitle}>Tổng quan gia đình</Text>
                <View style={styles.summaryRow}>
                    <View style={[styles.summaryCard, { backgroundColor: '#F3E8FF' }]}>
                        <Text style={styles.summaryLabel}>Tổng chi tiêu</Text>
                        <Text style={styles.summaryValue}>{(familyStats?.total_cost / 1000).toFixed(0)}k</Text>
                        <Text style={styles.summarySubtext}>Tất cả thời gian</Text>
                    </View>
                    <View style={[styles.summaryCard, { backgroundColor: '#DCFCE7' }]}>
                        <Text style={styles.summaryLabel}>Tổng món</Text>
                        <Text style={styles.summaryValue}>{familyStats?.total_items}</Text>
                        <Text style={styles.summarySubtext}>Đã mua</Text>
                    </View>
                    <View style={[styles.summaryCard, { backgroundColor: '#DBEAFE' }]}>
                        <Text style={styles.summaryLabel}>Đã check</Text>
                        <Text style={styles.summaryValue}>{familyStats?.checked_items}</Text>
                        <Text style={styles.summarySubtext}>Sản phẩm</Text>
                    </View>
                </View>
            </View>

            {/* Top Ingredients by Quantity */}
            <View style={styles.statsSection}>
                <Text style={styles.sectionTitle}>Top nguyên liệu theo số lượng</Text>
                <TopIngredients
                    title="Top nguyên liệu"
                    subtitle="Số lượng mua"
                    ingredients={topIngredientsByQuantity}
                    showQuantity={true}
                />
            </View>

            {/* Top Ingredients by Cost */}
            <View style={styles.statsSection}>
                <Text style={styles.sectionTitle}>Top nguyên liệu theo chi phí</Text>
                <TopIngredients
                    title="Top nguyên liệu"
                    subtitle="Giá tiền"
                    ingredients={topIngredientsByCost}
                    showQuantity={false}
                />
            </View>

            {/* Monthly Cost */}
            <View style={styles.statsSection}>
                <Text style={styles.sectionTitle}>Chi tiêu theo tháng ({new Date().getFullYear()})</Text>
                <View style={styles.monthlyCostContainer}>
                    {monthlyCostData.length > 0 ? (
                        monthlyCostData.map((item, index) => (
                            <View key={index} style={styles.monthRow}>
                                <Text style={styles.monthText}>{item.month}</Text>
                                <Text style={styles.monthCost}>{(item.total_cost / 1000).toFixed(0)}k</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.noDataText}>Không có dữ liệu</Text>
                    )}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.backgroundLight,
    },
    summarySection: {
        marginBottom: 20,
    },
    statsSection: {
        marginBottom: 20,
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.darkGrey,
        marginBottom: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    summaryCard: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        marginHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    summaryLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
        fontWeight: '600',
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 2,
    },
    summarySubtext: {
        fontSize: 10,
        color: '#9CA3AF',
    },
    monthlyCostContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 12,
    },
    monthRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    monthText: {
        fontSize: 14,
        color: COLORS.darkGrey,
        fontWeight: '600',
    },
    monthCost: {
        fontSize: 14,
        color: COLORS.purple,
        fontWeight: 'bold',
    },
    noDataText: {
        textAlign: 'center',
        paddingVertical: 20,
        color: COLORS.grey,
    },
});