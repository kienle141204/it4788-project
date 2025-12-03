import React from 'react';
import { View, Text, FlatList, StyleSheet, Image } from 'react-native';
import { COLORS } from '../../constants/themes';
import { Ionicons } from '@expo/vector-icons';

interface IngredientItem {
    ingredient_id: number;
    ingredient_name: string;
    ingredient_image?: string;
    total_quantity?: number;
    total_cost?: number;
}

interface TopIngredientsProps {
    title: string;
    subtitle: string;
    ingredients: IngredientItem[];
    showQuantity?: boolean;
}

export default function TopIngredients({ title, subtitle, ingredients, showQuantity = true }: TopIngredientsProps) {
    const renderItem = ({ item }: { item: IngredientItem }) => (
        <View style={styles.itemContainer}>
            <View style={styles.itemRow}>
                {item.ingredient_image ? (
                    <Image source={{ uri: item.ingredient_image }} style={styles.image} />
                ) : (
                    <View style={styles.placeholderImage}>
                        <Ionicons name="nutrition" size={24} color={COLORS.purple} />
                    </View>
                )}
                <View style={styles.textContainer}>
                    <Text style={styles.name} numberOfLines={1}>{item.ingredient_name}</Text>
                    <Text style={styles.subtitle}>{subtitle}</Text>
                </View>
                <View style={styles.quantityContainer}>
                    {showQuantity ? (
                        <Text style={styles.quantity}>{item.total_quantity || 0}</Text>
                    ) : (
                        <Text style={styles.quantity}>{item.total_cost?.toLocaleString('vi-VN')}đ</Text>
                    )}
                </View>
            </View>
        </View>
    );

    if (!ingredients || ingredients.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Không có dữ liệu</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={ingredients}
                renderItem={renderItem}
                keyExtractor={item => item.ingredient_id.toString()}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
    },
    itemContainer: {
        paddingVertical: 8,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    textContainer: {
        flex: 1,
        marginLeft: 12,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.darkGrey,
    },
    subtitle: {
        fontSize: 12,
        color: COLORS.grey,
        marginTop: 2,
    },
    quantityContainer: {
        alignItems: 'flex-end',
    },
    quantity: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.purple,
    },
    image: {
        width: 48,
        height: 48,
        borderRadius: 8,
        resizeMode: 'cover',
    },
    placeholderImage: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: '#F3E8FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.grey,
        textAlign: 'center',
    },
});