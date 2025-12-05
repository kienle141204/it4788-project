import { getAccess, postAccess, patchAccess, deleteAccess } from '../utils/api';

export interface FamilyMember {
  id: number;
  user_id: number;
  family_id: number;
  user: {
    id: number;
    email: string;
    fullname: string;
    avatar_url?: string;
  };
}

export interface Family {
  id: number;
  name: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
  members: FamilyMember[];
  owner: {
    id: number;
    email: string;
    fullname: string;
    avatar_url?: string;
  };
}

export interface GetMyFamilyResponse {
  message: string;
  data: Family[];
}

export const getMyFamily = async (): Promise<Family[]> => {
  try {
    const res: GetMyFamilyResponse = await getAccess('families/my-family');
    return res.data;
  } catch (error) {
    console.error('Error getting my family:', error);
    throw error;
  }
};

export const getFamilyById = async (id: number): Promise<Family> => {
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
 * POST /families
 */
export const createFamily = async (data: {
  name: string;
  owner_id?: number;
}) => {
  try {
    const res = await postAccess('families', data);
    return res;
  } catch (error) {
    console.error('Error creating family:', error);
    throw error;
  }
};

/**
 * Cập nhật thông tin gia đình
 * PUT /families/:id
 */
export const updateFamily = async (
  id: number,
  data: {
    name?: string;
    owner_id?: number;
  }
) => {
  try {
    const res = await patchAccess(`families/${id}`, data);
    return res;
  } catch (error) {
    console.error(`Error updating family ${id}:`, error);
    throw error;
  }
};

/**
 * Xóa gia đình
 * DELETE /families/:id
 */
export const deleteFamily = async (id: number) => {
  try {
    const res = await deleteAccess(`families/${id}`);
    return res;
  } catch (error) {
    console.error(`Error deleting family ${id}:`, error);
    throw error;
  }
};

/**
 * Thêm thành viên vào gia đình
 * POST /families/add-member
 */
export const addFamilyMember = async (data: {
  family_id: number;
  member_id: number;
  role: 'member' | 'manager';
}) => {
  try {
    const res = await postAccess('families/add-member', data);
    return res;
  } catch (error) {
    console.error('Error adding family member:', error);
    throw error;
  }
};

/**
 * Lấy mã mời và QR code của gia đình
 * GET /families/:id/invitation
 */
export const getFamilyInvitationCode = async (familyId: number) => {
  try {
    const res = await getAccess(`families/${familyId}/invitation`);
    return res;
  } catch (error) {
    console.error(`Error getting invitation code for family ${familyId}:`, error);
    throw error;
  }
};

/**
 * Tham gia gia đình bằng mã mời
 * POST /families/join
 */
export const joinFamilyByCode = async (invitationCode: string) => {
  try {
    const res = await postAccess('families/join', { invitation_code: invitationCode });
    return res;
  } catch (error) {
    console.error('Error joining family by code:', error);
    throw error;
  }
};

/**
 * Rời khỏi gia đình
 * POST /families/:id/leave
 */
export const leaveFamily = async (familyId: number) => {
  try {
    const res = await postAccess(`families/${familyId}/leave`, {});
    return res;
  } catch (error) {
    console.error(`Error leaving family ${familyId}:`, error);
    throw error;
  }
};

/**
 * Lấy tất cả gia đình (admin only)
 * GET /families
 */
export const getAllFamilies = async () => {
  try {
    const res = await getAccess('families');
    return res;
  } catch (error) {
    console.error('Error getting all families:', error);
    throw error;
  }
};

/**
 * Lấy danh sách thành viên của gia đình kèm thông tin chi tiết
 * GET /families/:id/members
 */
export const getFamilyMembers = async (familyId: number) => {
  try {
    const res = await getAccess(`families/${familyId}/members`);
    return res;
  } catch (error) {
    console.error(`Error getting members for family ${familyId}:`, error);
    throw error;
  }
};

 * Rời family
 */
export const leaveFamily = async (id: number) => {
  try {
    const res = await deleteAccess(`families/leave/${id}`);
    return res;
  } catch (error) {
    console.error(`Error leaving family ${id}:`, error);
    throw error;
  }
};
