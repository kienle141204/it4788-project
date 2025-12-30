import { getAccess, postAccess, patchAccess, deleteAccess } from '../utils/api';

// Shopping Statistics APIs

// Get my shopping lists
export const getMyShoppingLists = async () => {
  try {
    const res = await getAccess(`shopping-lists/my-list`);
    return res;
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy danh sách mua sắm của family (đã chia sẻ)
 * GET /shopping-lists/my-family-shared/:familyId
 */
export const getFamilyShoppingLists = async (familyId: number) => {
  try {
    const res = await getAccess(`shopping-lists/my-family-shared/${familyId}`);
    return res;
  } catch (error) {
    throw error;
  }
};



/**
 * Lấy tổng chi phí theo tháng
 * GET /shopping-statistics/monthly-cost
 */
export const getMonthlyCost = async (year: number, familyId: number) => {
  try {
    const res = await getAccess(`shopping-statistics/monthly-cost`, {
      year,
      familyId
    });
    return res;
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy số lượng item đã check
 * GET /shopping-statistics/checked-items
 */
export const getCheckedItemsCount = async (familyId: number) => {
  try {
    const res = await getAccess(`shopping-statistics/checked-items`, {
      familyId
    });
    return res;
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy top nguyên liệu theo số lượng
 * GET /shopping-statistics/top-ingredients
 */
export const getTopIngredientsByQuantity = async (familyId: number, limit: number = 5) => {
  try {
    const res = await getAccess(`shopping-statistics/top-ingredients`, {
      familyId,
      limit
    });
    return res;
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy top nguyên liệu theo tổng tiền
 * GET /shopping-statistics/top-ingredients-cost
 */
export const getTopIngredientsByCost = async (familyId: number, limit: number = 5) => {
  try {
    const res = await getAccess(`shopping-statistics/top-ingredients-cost`, {
      familyId,
      limit
    });
    return res;
  } catch (error) {
    throw error;
  }
};


/**
 * Lấy thống kê theo user (cá nhân)
 * GET /shopping-statistics/user/:userId
 */
export const getUserStatistics = async (userId: number) => {
  try {
    const res = await getAccess(`shopping-statistics/user/${userId}`);
    return res;
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy thống kê theo family
 * GET /shopping-statistics/family/:familyId
 */
export const getFamilyStatistics = async (familyId: number) => {
  try {
    const res = await getAccess(`shopping-statistics/family/${familyId}`);
    return res;
  } catch (error) {
    throw error;
  }
};