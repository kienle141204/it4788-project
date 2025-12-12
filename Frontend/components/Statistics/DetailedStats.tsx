// import React, { useEffect, useState } from 'react';
// import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
// import { COLORS } from '../../constants/themes';
// import { getMyShoppingLists } from '../../service/statistics';
// import { Ionicons } from '@expo/vector-icons';

// interface ShoppingList {
//     id: number;
//     cost: number;
//     shopping_date: string;
//     is_shared: boolean;
//     items?: any[];
// }

// export default function DetailedStats() {
//     const [myLists, setMyLists] = useState<ShoppingList[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [stats, setStats] = useState({
//         totalCost: 0,
//         totalLists: 0,
//         totalItems: 0,
//         sharedLists: 0,
//     });

//     useEffect(() => {
//         const fetchMyLists = async () => {
//             try {
//                 setLoading(true);
//                 const lists = await getMyShoppingLists();
//                 setMyLists(lists || []);

//                 // Calculate statistics
//                 const totalCost = lists?.reduce((sum: number, list: ShoppingList) => sum + (list.cost || 0), 0) || 0;
//                 const totalItems = lists?.reduce((sum: number, list: ShoppingList) => sum + (list.items?.length || 0), 0) || 0;
//                 const sharedLists = lists?.filter((list: ShoppingList) => list.is_shared).length || 0;

//                 setStats({
//                     totalCost,
//                     totalLists: lists?.length || 0,
//                     totalItems,
//                     sharedLists,
//                 });
//             } catch (error) {
//                 console.error('Error fetching my shopping lists:', error);
//                 setMyLists([]);
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchMyLists();
//     }, []);

//     const formatCurrency = (amount: number) => {
//         return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
//     };

//     const formatDate = (dateString: string) => {
//         const date = new Date(dateString);
//         return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
//     };

//     if (loading) {
//         return (
//             <View style={styles.loadingContainer}>
//                 <ActivityIndicator size="large" color={COLORS.purple} />
//             </View>
//         );
//     }

//     return (
//         <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
//             {/* Summary Cards */}
//             <View style={styles.summarySection}>
//                 <Text style={styles.sectionTitle}>Thống kê chi tiêu cá nhân</Text>
//                 <View style={styles.summaryRow}>
//                     <View style={[styles.summaryCard, { backgroundColor: '#DBEAFE' }]}>
//                         <Ionicons name="wallet" size={24} color="#3B82F6" style={styles.cardIcon} />
//                         <Text style={styles.summaryLabel}>Tổng chi tiêu</Text>
//                         <Text style={styles.summaryValue}>{formatCurrency(stats.totalCost)}</Text>
//                     </View>
//                     <View style={[styles.summaryCard, { backgroundColor: '#DCFCE7' }]}>
//                         <Ionicons name="list" size={24} color="#10B981" style={styles.cardIcon} />
//                         <Text style={styles.summaryLabel}>Danh sách</Text>
//                         <Text style={styles.summaryValue}>{stats.totalLists}</Text>
//                     </View>
//                 </View>
//                 <View style={styles.summaryRow}>
//                     <View style={[styles.summaryCard, { backgroundColor: '#FEF3C7' }]}>
//                         <Ionicons name="cart" size={24} color="#F59E0B" style={styles.cardIcon} />
//                         <Text style={styles.summaryLabel}>Tổng sản phẩm</Text>
//                         <Text style={styles.summaryValue}>{stats.totalItems}</Text>
//                     </View>
//                     <View style={[styles.summaryCard, { backgroundColor: '#F3E8FF' }]}>
//                         <Ionicons name="people" size={24} color="#A855F7" style={styles.cardIcon} />
//                         <Text style={styles.summaryLabel}>Đã chia sẻ</Text>
//                         <Text style={styles.summaryValue}>{stats.sharedLists}</Text>
//                     </View>
//                 </View>
//             </View>

//             {/* Detailed List */}
//             <View style={styles.detailSection}>
//                 <Text style={styles.sectionTitle}>Chi tiết danh sách</Text>
//                 {myLists.length > 0 ? (
//                     myLists.map((list) => (
//                         <View key={list.id} style={styles.detailCard}>
//                             <View style={styles.detailHeader}>
//                                 <View style={styles.detailDate}>
//                                     <Ionicons name="calendar" size={16} color={COLORS.purple} />
//                                     <Text style={styles.dateText}>{formatDate(list.shopping_date)}</Text>
//                                 </View>
//                                 {list.is_shared && (
//                                     <View style={styles.sharedBadge}>
//                                         <Ionicons name="people" size={12} color={COLORS.purple} />
//                                         <Text style={styles.sharedText}>Chia sẻ</Text>
//                                     </View>
//                                 )}
//                             </View>
//                             <View style={styles.detailBody}>
//                                 <View style={styles.detailRow}>
//                                     <Text style={styles.detailLabel}>Số sản phẩm:</Text>
//                                     <Text style={styles.detailValue}>{list.items?.length || 0}</Text>
//                                 </View>
//                                 <View style={styles.detailRow}>
//                                     <Text style={styles.detailLabel}>Chi phí:</Text>
//                                     <Text style={[styles.detailValue, styles.costValue]}>
//                                         {formatCurrency(list.cost || 0)}
//                                     </Text>
//                                 </View>
//                             </View>
//                         </View>
//                     ))
//                 ) : (
//                     <View style={styles.emptyContainer}>
//                         <Ionicons name="document-text-outline" size={64} color={COLORS.grey} />
//                         <Text style={styles.emptyText}>Chưa có danh sách chi tiết</Text>
//                     </View>
//                 )}
//             </View>
//         </ScrollView>
//     );
// }

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: COLORS.backgroundLight,
//         padding: 16,
//     },
//     loadingContainer: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//         backgroundColor: COLORS.backgroundLight,
//     },
//     summarySection: {
//         marginBottom: 20,
//     },
//     sectionTitle: {
//         fontSize: 18,
//         fontWeight: 'bold',
//         color: COLORS.darkGrey,
//         marginBottom: 16,
//     },
//     summaryRow: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         marginBottom: 12,
//     },
//     summaryCard: {
//         flex: 1,
//         padding: 16,
//         borderRadius: 12,
//         marginHorizontal: 4,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 1 },
//         shadowOpacity: 0.05,
//         shadowRadius: 2,
//         elevation: 1,
//     },
//     cardIcon: {
//         marginBottom: 8,
//     },
//     summaryLabel: {
//         fontSize: 12,
//         color: '#6B7280',
//         marginBottom: 4,
//         fontWeight: '600',
//     },
//     summaryValue: {
//         fontSize: 20,
//         fontWeight: 'bold',
//         color: '#1F2937',
//     },
//     detailSection: {
//         marginBottom: 20,
//     },
//     detailCard: {
//         backgroundColor: COLORS.white,
//         borderRadius: 12,
//         padding: 16,
//         marginBottom: 12,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 1 },
//         shadowOpacity: 0.05,
//         shadowRadius: 3,
//         elevation: 2,
//     },
//     detailHeader: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         marginBottom: 12,
//         paddingBottom: 12,
//         borderBottomWidth: 1,
//         borderBottomColor: '#F3F4F6',
//     },
//     detailDate: {
//         flexDirection: 'row',
//         alignItems: 'center',
//     },
//     dateText: {
//         marginLeft: 6,
//         fontSize: 14,
//         fontWeight: '600',
//         color: COLORS.darkGrey,
//     },
//     sharedBadge: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         backgroundColor: '#F3E8FF',
//         paddingHorizontal: 8,
//         paddingVertical: 4,
//         borderRadius: 12,
//     },
//     sharedText: {
//         fontSize: 11,
//         color: COLORS.purple,
//         marginLeft: 4,
//         fontWeight: '600',
//     },
//     detailBody: {
//         gap: 8,
//     },
//     detailRow: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//     },
//     detailLabel: {
//         fontSize: 14,
//         color: COLORS.grey,
//     },
//     detailValue: {
//         fontSize: 14,
//         fontWeight: '600',
//         color: COLORS.darkGrey,
//     },
//     costValue: {
//         color: COLORS.purple,
//         fontSize: 16,
//         fontWeight: 'bold',
//     },
//     emptyContainer: {
//         paddingVertical: 40,
//         alignItems: 'center',
//     },
//     emptyText: {
//         marginTop: 16,
//         fontSize: 16,
//         color: COLORS.grey,
//         textAlign: 'center',
//     },
// });