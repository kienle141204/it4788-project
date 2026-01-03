import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/themes';
import ShoppingHistory from '../../components/Statistics/ShoppingHistory';
import SpendingCharts from '../../components/Statistics/SpendingCharts';
import { safeGoBack } from '@/utils/navigation';
// import DetailedStats from '../../components/Statistics/DetailedStats';

export default function StatisticsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<'details' | 'charts'>('details');

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: 10 }]}>
                <TouchableOpacity onPress={() => safeGoBack(router)} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.darkGrey} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thống kê mua sắm</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'details' && styles.activeTab]}
                    onPress={() => setActiveTab('details')}
                >
                    <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>
                        Chi tiết
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'charts' && styles.activeTab]}
                    onPress={() => setActiveTab('charts')}
                >
                    <Text style={[styles.tabText, activeTab === 'charts' && styles.activeTabText]}>
                        Biểu đồ
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {activeTab === 'details' ? <ShoppingHistory /> : <SpendingCharts />}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.darkGrey,
    },
    tabContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: COLORS.white,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: COLORS.purple,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.grey,
    },
    activeTabText: {
        color: COLORS.purple,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        backgroundColor: COLORS.backgroundLight,
    },
});