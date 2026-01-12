import { getAccess, postAccess, patchAccess, deleteAccess } from "@/utils/api";

// ==================== Refrigerator APIs ====================

// Lấy danh sách tủ lạnh của tôi
export const getMyRefrigerators = async () => {
  const res = await getAccess('fridge/my-frifge');
  // API returns { success, message, data: [...], pagination: {...} }
  // We need to extract the data array
  if (res?.data && Array.isArray(res.data)) {
    return res.data;
  }
  // Fallback: if response is already an array
  if (Array.isArray(res)) {
    return res;
  }
  // If response has id, it's a single object
  if (res?.id) {
    return [res];
  }
  return [];
};

// Tạo tủ lạnh mới
export const createRefrigerator = async (data: {
  owner_id?: number; // Optional - backend will derive from JWT token
  family_id?: number;
}) => {
  const res = await postAccess('fridge', data);
  return res;
};

// Lấy thông tin chi tiết tủ lạnh theo ID
export const getRefrigeratorById = async (id: number) => {
  const res = await getAccess(`fridge/${id}`);
  return res;
};

// Cập nhật tủ lạnh
export const updateRefrigerator = async (id: number, data: {
  owner_id?: number;
  family_id?: number;
}) => {
  const res = await patchAccess(`fridge/${id}`, data);
  return res;
};

// Xóa tủ lạnh
export const deleteRefrigerator = async (id: number) => {
  const res = await deleteAccess(`fridge/${id}`);
  return res;
};

// Lấy tủ lạnh của gia đình
export const getFamilyRefrigerators = async (familyId: number) => {
  const res = await getAccess(`fridge/my-family/${familyId}`);
  // API returns { success, message, data: [...], pagination: {...} }
  if (res?.data && Array.isArray(res.data)) {
    return res.data;
  }
  if (Array.isArray(res)) {
    return res;
  }
  if (res?.id) {
    return [res];
  }
  return [];
};

// ==================== Fridge Dishes APIs ====================

// Lấy danh sách món ăn trong tủ lạnh
export const getRefrigeratorDishes = async (refrigeratorId: number) => {
  const res = await getAccess(`fridge/${refrigeratorId}/dishes`);
  return res;
};

// Thêm món ăn vào tủ lạnh
export const addDishToRefrigerator = async (
  refrigeratorId: number,
  data: {
    dish_id: number;
    stock?: number;
    price?: number;
    expiration_date?: string | Date;
    note?: string;
  }
) => {
  const res = await postAccess(`fridge/${refrigeratorId}/dishes`, data);
  return res;
};

// Cập nhật món ăn trong tủ lạnh
export const updateFridgeDish = async (
  dishId: number,
  data: {
    dish_id?: number;
    stock?: number;
    price?: number;
    expiration_date?: string | Date;
    note?: string;
  }
) => {
  const res = await patchAccess(`fridge/dishes/${dishId}`, data);
  return res;
};

// Xóa món ăn khỏi tủ lạnh
export const removeFridgeDish = async (dishId: number) => {
  const res = await deleteAccess(`fridge/dishes/${dishId}`);
  return res;
};

// ==================== Fridge Ingredients APIs ====================

// Lấy danh sách nguyên liệu trong tủ lạnh
export const getRefrigeratorIngredients = async (refrigeratorId: number) => {
  const res = await getAccess(`fridge/${refrigeratorId}/ingredients`);
  return res;
};

// Thêm nguyên liệu vào tủ lạnh
export const addIngredientToRefrigerator = async (
  refrigeratorId: number,
  data: {
    ingredient_id?: number;
    dish_ingredient_id?: number;
    stock?: number;
    price?: number;
    expiration_date?: string | Date;
    note?: string;
  }
) => {
  const res = await postAccess(`fridge/${refrigeratorId}/ingredients`, data);
  return res;
};

// Cập nhật nguyên liệu trong tủ lạnh
export const updateFridgeIngredient = async (
  ingredientId: number,
  data: {
    ingredient_id?: number;
    dish_ingredient_id?: number;
    stock?: number;
    price?: number;
    expiration_date?: string | Date;
    note?: string;
  }
) => {
  const res = await patchAccess(`fridge/ingredients/${ingredientId}`, data);
  return res;
};

// Xóa nguyên liệu khỏi tủ lạnh
export const removeFridgeIngredient = async (ingredientId: number) => {
  const res = await deleteAccess(`fridge/ingredients/${ingredientId}`);
  return res;
};

// ==================== Suggestions API ====================

// Lấy gợi ý món ăn dựa trên nguyên liệu trong tủ lạnh
export const getDishSuggestions = async (refrigeratorId: number) => {
  const res = await getAccess(`fridge/${refrigeratorId}/suggestions`);
  return res;
};

