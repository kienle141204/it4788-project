import { getAccess, postAccess, patchAccess, deleteAccess } from '../utils/api';

export interface ShoppingItem {
  id: number;
  list_id: number;
  ingredient_id: number;
  stock: number;
  price: number | null;
  is_checked: boolean;
  created_at: string;
  ingredient: {
    id: number;
    name: string;
    image_url: string | null;
    price: number | null;
    description: string | null;
  };
}

export interface ShoppingList {
  id: number;
  owner_id: number;
  family_id: number;
  cost: number;
  is_shared: boolean;
  shopping_date: string;
  created_at: string;
  items: ShoppingItem[];
  owner?: {
    id: number;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

/**
 * Get all shared shopping lists for a family
 */
export const getShoppingListsByFamily = async (familyId: number): Promise<ShoppingList[]> => {
  try {
    const data = await getAccess(`shopping-lists/my-family-shared/${familyId}`);
    return data;
  } catch (error) {
    console.error('Error fetching shopping lists:', error);
    throw error;
  }
};

/**
 * Create a new shopping list for a family
 */
export const createShoppingList = async (
  familyId: number,
  shoppingDate: string,
  ownerId?: number
): Promise<ShoppingList> => {
  try {
    const payload: any = {
      family_id: familyId,
      shopping_date: shoppingDate,
      is_shared: true,
      cost: 0,
    };
    
    // Only include owner_id if it's provided and valid
    if (ownerId && !isNaN(ownerId)) {
      payload.owner_id = ownerId;
    }
    
    console.log('Creating shopping list with payload:', payload);
    
    const data = await postAccess('shopping-lists', payload);
    console.log('data', data);
    return data;
  } catch (error) {
    console.error('Error creating shopping list:', error);
    throw error;
  }
};

/**
 * Add an item to a shopping list
 */
export const addItemToList = async (
  listId: number,
  ingredientId: number,
  stock: number,
  price?: number
): Promise<ShoppingItem> => {
  try {
    const data = await postAccess('shopping-items', {
      list_id: listId,
      ingredient_id: ingredientId,
      stock,
      price,
      is_checked: false,
    });
    return data;
  } catch (error) {
    console.error('Error adding item to list:', error);
    throw error;
  }
};

/**
 * Toggle the checked status of a shopping item
 */
export const toggleItemChecked = async (itemId: number): Promise<ShoppingItem> => {
  try {
    const data = await patchAccess(`shopping-items/${itemId}/toggle`, {});
    return data;
  } catch (error) {
    console.error('Error toggling item checked:', error);
    throw error;
  }
};

/**
 * Update a shopping item
 */
export const updateShoppingItem = async (
  itemId: number,
  updates: { stock?: number; price?: number; is_checked?: boolean }
): Promise<ShoppingItem> => {
  try {
    const data = await patchAccess(`shopping-items/${itemId}`, updates);
    return data;
  } catch (error) {
    console.error('Error updating shopping item:', error);
    throw error;
  }
};

/**
 * Delete a shopping item
 */
export const deleteShoppingItem = async (itemId: number): Promise<void> => {
  try {
    await deleteAccess(`shopping-items/${itemId}`);
  } catch (error) {
    console.error('Error deleting shopping item:', error);
    throw error;
  }
};

/**
 * Delete a shopping list
 */
export const deleteShoppingList = async (listId: number): Promise<void> => {
  try {
    await deleteAccess(`shopping-lists/${listId}`);
  } catch (error) {
    console.error('Error deleting shopping list:', error);
    throw error;
  }
};

