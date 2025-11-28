import { getAccess, postAccess } from "@/utils/api";

export const ingredientPagination = async (params: object ={}) => {
  const res = await getAccess('ingredients/paginated', params)
  return res
}

// Tìm kiếm nguyên liệu với nhiều filter (name, category_id, place_id)
export const searchIngredients = async (params: {
  name?: string;
  category_id?: number;
  place_id?: number;
  page?: number;
  limit?: number;
} = {}) => {
  const res = await getAccess('ingredients/search', params);
  return res;
}

// Tìm kiếm nguyên liệu theo tên
export const searchIngredientsByName = async (params: {
  name?: string;
  page?: number;
  limit?: number;
} = {}) => {
  const res = await getAccess('ingredients/search/name', params);
  return res;
}

// Tìm kiếm nguyên liệu theo category
export const searchIngredientsByCategory = async (data: {
  category_id?: number;
  page?: number;
  limit?: number;
} = {}) => {
  const res = await postAccess('ingredients/search/category', data);
  return res;
}

// Lấy chi tiết nguyên liệu theo ID
export const getIngredientById = async (id: number) => {
  const res = await getAccess(`ingredients/${id}`);
  return res;
}