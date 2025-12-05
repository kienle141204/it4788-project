import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import axios from 'axios';
import { COLORS } from '@/constants/themes';

// Define Market interface
interface Market {
    name: string;
    lat: number;
    lon: number;
    type: string;
    osm_id: string;
    distance: number;
}

export default function NearestMarketScreen() {
    const router = useRouter();
    const [markets, setMarkets] = useState<Market[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [location, setLocation] = useState<Location.LocationObject | null>(null);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setErrorMsg('Quyền truy cập vị trí bị từ chối');
                    setLoading(false);
                    return;
                }

                let location = await Location.getCurrentPositionAsync({});
                setLocation(location);

                await fetchNearestMarkets(location.coords.latitude, location.coords.longitude);
            } catch (error) {
                console.error("Error getting location:", error);
                setErrorMsg('Không thể lấy vị trí hiện tại');
                setLoading(false);
            }
        })();
    }, []);

    const fetchNearestMarkets = async (lat: number, lon: number) => {
        try {
            // Replace with your actual backend URL
            // Assuming running on emulator/device, use appropriate IP or localhost
            // For Android Emulator: 10.0.2.2
            // For iOS Simulator: localhost
            // For Physical Device: Your Machine IP
            const backendUrl = 'http://localhost:8090'; // Update this if needed

            const response = await axios.get(`${backendUrl}/api/markets/nearest`, {
                params: { lat, lon }
            });

            setMarkets(response.data);
        } catch (err) {
            console.error("Error fetching markets:", err);
            setErrorMsg('Lỗi khi tải danh sách chợ');
        } finally {
            setLoading(false);
        }
    };

    const openMap = (lat: number, lon: number, label: string) => {
        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${lat},${lon}`;
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`
        });

        if (url) {
            Linking.openURL(url);
        }
    };

    const renderItem = ({ item }: { item: Market }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => openMap(item.lat, item.lon, item.name)}
        >
            <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                    <Ionicons name="storefront-outline" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.infoContainer}>
                    <Text style={styles.marketName}>{item.name}</Text>
                    <Text style={styles.distance}>Khoảng cách: {item.distance.toFixed(2)} km</Text>
                    <Text style={styles.coordinates}>
                        {item.lat.toFixed(4)}, {item.lon.toFixed(4)}
                    </Text>
                </View>
                <Ionicons name="navigate-circle-outline" size={32} color={COLORS.primary} />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.darkGrey} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chợ Gần Đây</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Đang tìm chợ gần bạn...</Text>
                </View>
            ) : errorMsg ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color={'#EF4444'} />
                    <Text style={styles.errorText}>{errorMsg}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => {
                            setLoading(true);
                            setErrorMsg(null);
                            (async () => {
                                try {
                                    let location = await Location.getCurrentPositionAsync({});
                                    setLocation(location);
                                    await fetchNearestMarkets(location.coords.latitude, location.coords.longitude);
                                } catch (e) {
                                    setErrorMsg('Thử lại thất bại');
                                    setLoading(false);
                                }
                            })();
                        }}
                    >
                        <Text style={styles.retryText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={markets}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.centerContainer}>
                            <Text>Không tìm thấy chợ nào gần đây.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50, // Adjust for status bar
        paddingBottom: 16,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.darkGrey,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        color: COLORS.grey,
        fontSize: 16,
    },
    errorText: {
        marginTop: 10,
        color: '#EF4444',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        marginBottom: 12,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
        elevation: 2,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E8F5E9', // Light green
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    infoContainer: {
        flex: 1,
    },
    marketName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.darkGrey,
        marginBottom: 4,
    },
    distance: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '500',
        marginBottom: 2,
    },
    coordinates: {
        fontSize: 12,
        color: COLORS.grey,
    },
    retryButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
    },
    retryText: {
        color: COLORS.white,
        fontWeight: 'bold',
    },
});
