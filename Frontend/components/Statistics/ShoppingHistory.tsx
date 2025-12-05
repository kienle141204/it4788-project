import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../../constants/themes';
import { Ionicons } from '@expo/vector-icons';
import { getFamilyStatistics } from '../../service/statistics';
import { getMyFamily } from '../../service/family';
import { getUserProfile } from '../../service/auth';

interface ShoppingHistoryItem {
    id: string;
    date: string;
    items: number;
    total: string;
    store: string;
}

export default function ShoppingHistory() {
    const [history, setHistory] = useState<ShoppingHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentFamilyId, setCurrentFamilyId] = useState<number | null>(null);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Get user profile to get userId
                const userProfile = await getUserProfile();
                setCurrentUserId(userProfile.id);

                // Get user's families
                const families = await getMyFamily();
                if (families && families.length > 0) {
                    // Use the first family as the current one (in a real app, user might select which family to view)
                    setCurrentFamilyId(families[0].id);
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
        const fetchHistory = async () => {
            try {
                setLoading(true);
                // For now, using mock data - in the future, we'll get real shopping history
                // The backend doesn't have an endpoint for detailed shopping history yet
                const mockHistory: ShoppingHistoryItem[] = [
                    { id: '1', date: '28/11/2025', items: 5, total: '150.000đ', store: 'Siêu thị BigC' },
                    { id: '2', date: '25/11/2025', items: 12, total: '450.000đ', store: 'Chợ Bến Thành' },
                    { id: '3', date: '20/11/2025', items: 3, total: '85.000đ', store: 'VinMart' },
                    { id: '4', date: '15/11/2025', items: 8, total: '210.000đ', store: 'Siêu thị CoopMart' },
                    { id: '5', date: '10/11/2025', items: 15, total: '520.000đ', store: 'Chợ Bà Chiểu' },
                ];
                setHistory(mockHistory);
            } catch (error) {
                console.error('Error fetching shopping history:', error);
                // Still use mock data if there's an error
                const mockHistory: ShoppingHistoryItem[] = [
                    { id: '1', date: '28/11/2025', items: 5, total: '150.000đ', store: 'Siêu thị BigC' },
                    { id: '2', date: '25/11/2025', items: 12, total: '450.000đ', store: 'Chợ Bến Thành' },
                ];
                setHistory(mockHistory);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [currentFamilyId]);

    const renderItem = ({ item }: { item: ShoppingHistoryItem }) => (
        <View style={styles.card}>
            <View style={styles.iconContainer}>
                <Ionicons name="cart" size={24} color={COLORS.purple} />
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.storeName}>{item.store}</Text>
                <Text style={styles.date}>{item.date}</Text>
            </View>
            <View style={styles.amountContainer}>
                <Text style={styles.total}>{item.total}</Text>
                <Text style={styles.items}>{item.items} món</Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.purple} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={history}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.backgroundLight,
    },
    listContent: {
        padding: 20,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F3E8FF', // Light purple
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    infoContainer: {
        flex: 1,
    },
    storeName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.darkGrey,
        marginBottom: 4,
    },
    date: {
        fontSize: 14,
        color: COLORS.grey,
    },
    amountContainer: {
        alignItems: 'flex-end',
    },
    total: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.purple,
        marginBottom: 4,
    },
    items: {
        fontSize: 12,
        color: COLORS.grey,
    },
});