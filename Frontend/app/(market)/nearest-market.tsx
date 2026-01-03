import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Linking, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import axios from 'axios';
import { COLORS } from '../../constants/themes';

interface Market {
    name: string;
    lat: number;
    lon: number;
    distance: number;
}

export default function NearestMarketScreen() {
    const router = useRouter();
    const [markets, setMarkets] = useState<Market[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null);

    useEffect(() => {
        getLocationAndFetchMarkets();
    }, []);

    const getLocationAndFetchMarkets = async () => {
        try {
            setLoading(true);
            setErrorMsg(null);

            // Request location permission
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Vui lòng cấp quyền truy cập vị trí');
                setLoading(false);
                return;
            }

            // Get current location
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            setCurrentLocation({ lat: location.coords.latitude, lon: location.coords.longitude });
            await fetchNearestMarkets(location.coords.latitude, location.coords.longitude);
        } catch (error: any) {
            setErrorMsg('Không thể lấy vị trí của bạn');
            setLoading(false);
        }
    };

    const fetchNearestMarkets = async (lat: number, lon: number) => {
        try {
            const backendUrl = 'https://it4788-deploy-8.onrender.com';
            const response = await axios.get(`${backendUrl}/api/markets/nearest`, {
                params: { lat, lon, limit: 5 }
            });

            const top5Markets = (response.data || []).slice(0, 5);
            setMarkets(top5Markets);
        } catch (err) {
            setErrorMsg('Không thể tải danh sách chợ');
        } finally {
            setLoading(false);
        }
    };

    const openMap = (lat: number, lon: number, name: string) => {
        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${lat},${lon}`;
        const url = Platform.select({
            ios: `${scheme}${name}@${latLng}`,
            android: `${scheme}${latLng}(${name})`
        });
        if (url) Linking.openURL(url);
    };

    const renderMarket = ({ item, index }: { item: Market; index: number }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => openMap(item.lat, item.lon, item.name)}
        >
            <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{index + 1}</Text>
            </View>
            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.distance}>{item.distance.toFixed(2)} km</Text>
            </View>
            <Ionicons name="navigate" size={24} color={COLORS.primary} />
        </TouchableOpacity>
    );

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} translucent={false} />
            <SafeAreaView style={[styles.container, { backgroundColor: COLORS.background }]} edges={['top']}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: COLORS.background }]}>
                <TouchableOpacity onPress={() => {
                    if (router.canGoBack()) {
                        router.back();
                    } else {
                        router.replace('/(tabs)/home' as any);
                    }
                }}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.darkGrey} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>5 Chợ Gần Nhất</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Đang tìm chợ...</Text>
                </View>
            ) : errorMsg ? (
                <View style={styles.center}>
                    <Ionicons name="alert-circle" size={48} color="#EF4444" />
                    <Text style={styles.errorText}>{errorMsg}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={getLocationAndFetchMarkets}>
                        <Text style={styles.retryText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={markets}
                    renderItem={renderMarket}
                    keyExtractor={(_, i) => i.toString()}
                    contentContainerStyle={styles.list}
                    ListHeaderComponent={
                        currentLocation ? (
                            <View style={styles.locationCard}>
                                <View style={styles.locationIcon}>
                                    <Ionicons name="location" size={24} color="#EF4444" />
                                </View>
                                <View style={styles.locationInfo}>
                                    <Text style={styles.locationLabel}>Vị trí hiện tại của bạn</Text>
                                    <Text style={styles.locationCoords}>
                                        {currentLocation.lat.toFixed(4)}, {currentLocation.lon.toFixed(4)}
                                    </Text>
                                </View>
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text>Không tìm thấy chợ nào</Text>
                        </View>
                    }
                />
            )}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.darkGrey,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        color: COLORS.grey,
    },
    errorText: {
        marginTop: 12,
        color: '#EF4444',
        textAlign: 'center',
        marginBottom: 16,
    },
    retryBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryText: {
        color: COLORS.white,
        fontWeight: 'bold',
    },
    list: {
        padding: 16,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    rankBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    rankText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 14,
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.darkGrey,
        marginBottom: 4,
    },
    distance: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '500',
    },
    locationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    locationIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    locationInfo: {
        flex: 1,
    },
    locationLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#991B1B',
        marginBottom: 4,
    },
    locationCoords: {
        fontSize: 13,
        color: '#DC2626',
    },
});
