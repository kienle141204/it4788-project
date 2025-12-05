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
 * Tạo family mới
 */
export const createFamily = async (data: { name: string }) => {
  try {
    const res = await postAccess('families', data);
    return res;
  } catch (error) {
    console.error('Error creating family:', error);
    throw error;
  }
};

/**
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