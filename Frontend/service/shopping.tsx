import { getAccess, postAccess, patchAccess, deleteAccess } from '../utils/api';

// Shopping List APIs


export const getMyShoppingLists = async () => {
  try {
    const res = await getAccess('shopping-lists/my-list');
    return res;
  } catch (error) {
    throw error;
  }
};

export const getShoppingListById = async (id: number) => {
  try {
    const res = await getAccess(`shopping-lists/${id}`);
    return res;
  } catch (error) {
    throw error;
  }
};


export const getFamilySharedLists = async (familyId: number) => {
  try {
    const res = await getAccess(`shopping-lists/my-family-shared/${familyId}`);
    return res;
  } catch (error) {
    throw error;
  }
};

/**
 * Tạo danh sách mua sắm mới
 * POST /shopping-lists
 */
export const createShoppingList = async (data: {
  owner_id?: number;
  family_id?: number;
  cost?: number;
  is_shared?: boolean;
}) => {
  try {
    const res = await postAccess('shopping-lists', data);
    return res;
  } catch (error) {
    throw error;
  }
};


export const updateShoppingList = async (
  id: number,
  data: {
    cost?: number;
    is_shared?: boolean;
  }
) => {
  try {
    const res = await patchAccess(`shopping-lists/${id}`, data);
    return res;
  } catch (error) {
    throw error;
  }
};


export const shareShoppingList = async (id: number) => {
  try {
    const res = await patchAccess(`shopping-lists/share/${id}`, {});
    return res;
  } catch (error) {
    throw error;
  }
};

/**
 * Xóa danh sách mua sắm
 * DELETE /shopping-lists/:id
 */
export const deleteShoppingList = async (id: number) => {
  try {
    const res = await deleteAccess(`shopping-lists/${id}`);
    return res;
  } catch (error) {
    throw error;
  }
};

// Shopping Item APIs

/**
 * Lấy chi tiết shopping item theo ID
 * GET /shopping-items/:id
 */
export const getShoppingItem = async (id: number) => {
  try {
    const res = await getAccess(`shopping-items/${id}`);
    return res;
  } catch (error) {
    throw error;
  }
};

/**
 * Tạo shopping item mới
 * POST /shopping-items
 */
export const createShoppingItem = async (data: {
  list_id: number;
  ingredient_id: number;
  stock?: number;
  price?: number;
  is_checked?: boolean;
}) => {
  try {
    const res = await postAccess('shopping-items', data);
    return res;
  } catch (error) {
    throw error;
  }
};

/**
 * Cập nhật shopping item
 * PATCH /shopping-items/:id
 */
export const updateShoppingItem = async (
  id: number,
  data: {
    list_id?: number;
    ingredient_id?: number;
    stock?: number;
    price?: number;
    is_checked?: boolean;
  }
) => {
  try {
    const res = await patchAccess(`shopping-items/${id}`, data);
    return res;
  } catch (error) {
    throw error;
  }
};

/**
 * Đánh dấu đã mua item (toggle check)
 * PATCH /shopping-items/check/:id
 */
export const checkShoppingItem = async (id: number) => {
  try {
    const res = await patchAccess(`shopping-items/check/${id}`, {});
    return res;
  } catch (error) {
    throw error;
  }
};

/**
 * Xóa shopping item
 * DELETE /shopping-items/:id
 */
export const deleteShoppingItem = async (id: number) => {
  try {
    const res = await deleteAccess(`shopping-items/${id}`);
    return res;
  } catch (error) {
    throw error;
  }
};

