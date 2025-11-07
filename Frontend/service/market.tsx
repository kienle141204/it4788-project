import { getAccess } from "@/utils/api";

export const ingredientPagination = async (params: object ={}) => {
  const res = await getAccess('ingredients/paginated', params)
  return res
}