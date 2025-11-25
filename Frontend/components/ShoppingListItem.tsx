import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { taskStyles } from '../styles/task.styles';

interface ShoppingListItemProps {
  id: number;
  name: string;
  quantity: string;
  assignedTo?: string;
  isCompleted: boolean;
  onToggleComplete: (id: number) => void;
  onQuantityChange: (id: number, delta: number) => void;
  onAssign?: (id: number) => void;
}

const ShoppingListItem: React.FC<ShoppingListItemProps> = ({
  id,
  name,
  quantity,
  assignedTo,
  isCompleted,
  onToggleComplete,
  onQuantityChange,
  onAssign,
}) => {
  // Extract the numeric part from quantity string (e.g., "0.5kg" -> 0.5, "2 hộp" -> 2)
  const getInitialQuantity = () => {
    const match = quantity.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 1;
  };

  const [itemQuantity, setItemQuantity] = useState(getInitialQuantity());

  // Sync quantity when prop changes
  useEffect(() => {
    const newQuantity = getInitialQuantity();
    setItemQuantity(newQuantity);
  }, [quantity]);

  const handleDecrease = () => {
    if (itemQuantity > 1) {
      const newQuantity = itemQuantity - 1;
      setItemQuantity(newQuantity);
      onQuantityChange(id, -1);
    }
  };

  const handleIncrease = () => {
    const newQuantity = itemQuantity + 1;
    setItemQuantity(newQuantity);
    onQuantityChange(id, 1);
  };

  return (
    <View style={taskStyles.shoppingItem}>
      <TouchableOpacity
        onPress={() => onToggleComplete(id)}
        style={taskStyles.checkboxContainer}
      >
        <View style={[
          taskStyles.checkbox,
          isCompleted && taskStyles.checkboxChecked
        ]}>
          {isCompleted && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </View>
      </TouchableOpacity>

      <View style={taskStyles.itemContent}>
        <Text style={[
          taskStyles.itemName,
          isCompleted && taskStyles.itemNameCompleted
        ]}>
          {name}
        </Text>
        <Text style={taskStyles.itemQuantity}>Số lượng: {quantity}</Text>
        {assignedTo ? (
          <View style={taskStyles.assignedContainer}>
            <View style={taskStyles.avatar}>
              <Ionicons name="person" size={16} color="#FFFFFF" />
            </View>
            <Text style={taskStyles.assignedText}>{assignedTo}</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={taskStyles.assignButton}
            onPress={() => onAssign?.(id)}
          >
            <Ionicons name="person-outline" size={14} color="#FFFFFF" />
            <Text style={taskStyles.assignButtonText}>Gán</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={taskStyles.quantityControls}>
        <TouchableOpacity
          style={taskStyles.quantityButton}
          onPress={handleDecrease}
        >
          <Text style={taskStyles.quantityButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={taskStyles.quantityValue}>{Math.floor(itemQuantity)}</Text>
        <TouchableOpacity
          style={taskStyles.quantityButton}
          onPress={handleIncrease}
        >
          <Text style={taskStyles.quantityButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ShoppingListItem;

