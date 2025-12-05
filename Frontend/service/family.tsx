import { getAccess, postAccess, patchAccess, deleteAccess } from '../utils/api';

/**
 * Lấy danh sách các gia đình mà user là thành viên
 * GET /api/families/my-family
 */
export const getMyFamilies = async () => {
  try {
    const res = await getAccess('families/my-family');
    return res;
  } catch (error) {
    console.error('Error getting my families:', error);
    throw error;
  }
};

/**
 * Lấy thông tin chi tiết của một gia đình
 * GET /api/families/:id
 */
export const getFamilyById = async (id: number) => {
  try {
    const res = await getAccess(`families/${id}`);
    return res;
  } catch (error) {
    console.error(`Error getting family ${id}:`, error);
    throw error;
  }
};

/**
 * Tạo gia đình mới
 * POST /api/families
 */
export const createFamily = async (data: { name: string; owner_id?: number }) => {
  try {
    const res = await postAccess('families', data);
    return res;
  } catch (error) {
    console.error('Error creating family:', error);
    throw error;
  }
};

/**
 * Tham gia gia đình bằng mã mời
 * POST /api/families/join-by-code
 */
export const joinFamilyByCode = async (invitation_code: string) => {
  try {
    const res = await postAccess('families/join-by-code', { invitation_code });
    return res;
  } catch (error) {
    console.error('Error joining family by code:', error);
    throw error;
  }
};

/**
 * Rời khỏi gia đình
 * POST /api/families/:id/leave
 */
export const leaveFamily = async (id: number) => {
  try {
    const res = await postAccess(`families/${id}/leave`, {});
    return res;
  } catch (error) {
    console.error(`Error leaving family ${id}:`, error);
    throw error;
  }
};

/**
 * Lấy mã mời và QR code
 * GET /api/families/:id/invitation
 */
export const getInvitationCode = async (id: number) => {
  try {
    const res = await getAccess(`families/${id}/invitation`);
    return res;
  } catch (error) {
    console.error(`Error getting invitation code for family ${id}:`, error);
    throw error;
  }
};

/**
 * Lấy thống kê shopping list của family
 * GET /api/shopping-statistics/family/:familyId
 */
export const getFamilyShoppingStatistics = async (familyId: number) => {
  try {
    const res = await getAccess(`shopping-statistics/family/${familyId}`);
    return res;
  } catch (error) {
    console.error(`Error getting shopping statistics for family ${familyId}:`, error);
    throw error;
  }
};

