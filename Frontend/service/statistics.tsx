import { getAccess, postAccess, patchAccess, deleteAccess } from '../utils/api';

// Shopping Statistics APIs

// Get my shopping lists
export const getMyShoppingLists = async () => {
  console.log('API CALL: getMyShoppingLists');
  try {
    const res = await getAccess(`shopping-lists/my-list`);
    console.log('API RESPONSE: getMyShoppingLists', res);
    return res;
  } catch (error) {
    console.error('Error getting my shopping lists:', error);
    throw error;
  }
};

/**
 * Lấy danh sách mua sắm của family (đã chia sẻ)
 * GET /shopping-lists/family/:familyId
 */
export const getFamilyShoppingLists = async (familyId: number) => {
  console.log('API CALL: getFamilyShoppingLists', { familyId });
  try {
    const res = await getAccess(`shopping-lists/family/${familyId}`);
    console.log('API RESPONSE: getFamilyShoppingLists', res);
    return res;
  } catch (error) {
    console.error('Error getting family shopping lists:', error);
    throw error;
  }
};



/**
 * Lấy tổng chi phí theo tháng
 * GET /shopping-statistics/monthly-cost
 */
export const getMonthlyCost = async (year: number, familyId: number) => {
  console.log('API CALL: getMonthlyCost', { year, familyId });
  try {
    const res = await getAccess(`shopping-statistics/monthly-cost`, {
      year,
      familyId
    });
    console.log('API RESPONSE: getMonthlyCost', res);
    return res;
  } catch (error) {
    console.error('Error getting monthly cost:', error);
    throw error;
  }
};

/**
 * Lấy số lượng item đã check
 * GET /shopping-statistics/checked-items
 */
export const getCheckedItemsCount = async (familyId: number) => {
  console.log('API CALL: getCheckedItemsCount', { familyId });
  try {
    const res = await getAccess(`shopping-statistics/checked-items`, {
      familyId
    });
    console.log('API RESPONSE: getCheckedItemsCount', res);
    return res;
  } catch (error) {
    console.error('Error getting checked items count:', error);
    throw error;
  }
};

/**
 * Lấy top nguyên liệu theo số lượng
 * GET /shopping-statistics/top-ingredients
 */
export const getTopIngredientsByQuantity = async (familyId: number, limit: number = 5) => {
  console.log('API CALL: getTopIngredientsByQuantity', { familyId, limit });
  try {
    const res = await getAccess(`shopping-statistics/top-ingredients`, {
      familyId,
      limit
    });
    console.log('API RESPONSE: getTopIngredientsByQuantity', res);
    return res;
  } catch (error) {
    console.error('Error getting top ingredients by quantity:', error);
    throw error;
  }
};

/**
 * Lấy top nguyên liệu theo tổng tiền
 * GET /shopping-statistics/top-ingredients-cost
 */
export const getTopIngredientsByCost = async (familyId: number, limit: number = 5) => {
  console.log('API CALL: getTopIngredientsByCost', { familyId, limit });
  try {
    const res = await getAccess(`shopping-statistics/top-ingredients-cost`, {
      familyId,
      limit
    });
    console.log('API RESPONSE: getTopIngredientsByCost', res);
    return res;
  } catch (error) {
    console.error('Error getting top ingredients by cost:', error);
    throw error;
  }
};


/**
 * Lấy thống kê theo user (cá nhân)
 * GET /shopping-statistics/user/:userId
 */
export const getUserStatistics = async (userId: number) => {
  console.log('API CALL: getUserStatistics', { userId });
  try {
    const res = await getAccess(`shopping-statistics/user/${userId}`);
    console.log('API RESPONSE: getUserStatistics', res);
    return res;
  } catch (error) {
    console.error('Error getting user statistics:', error);
    throw error;
  }
};

/**
 * Lấy thống kê theo family
 * GET /shopping-statistics/family/:familyId
 */
export const getFamilyStatistics = async (familyId: number) => {
  console.log('API CALL: getFamilyStatistics', { familyId });
  try {
    const res = await getAccess(`shopping-statistics/family/${familyId}`);
    console.log('API RESPONSE: getFamilyStatistics', res);
    return res;
  } catch (error) {
    console.error('Error getting family statistics:', error);
    throw error;
  }
};