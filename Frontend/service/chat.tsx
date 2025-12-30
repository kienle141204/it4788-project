import { getAccess, postAccess, patchAccess } from '../utils/api';

export interface ChatMessage {
    id: number;
    userId: number;
    title: string;
    message: string;
    data?: Record<string, any>;
    isRead: boolean;
    familyId: number;
    createdAt: string;
    // Populated from family members
    user?: {
        id: number;
        full_name?: string;
        fullname?: string;
        email: string;
        avatar_url?: string | null;
    };
    role?: 'owner' | 'manager' | 'member';
}

export interface SendChatMessageDto {
    familyId: number;
    title: string;
    message: string;
    data?: Record<string, any>;
}

/**
 * Lấy danh sách tin nhắn của nhóm
 * GET /chat/family/:familyId
 */
export const getChatMessages = async (familyId: number): Promise<ChatMessage[]> => {
    try {
        const res = await getAccess(`chat/family/${familyId}`);
        // API may return array directly or wrapped in { data }
        if (Array.isArray(res)) {
            return res;
        }
        if (Array.isArray(res?.data)) {
            return res.data;
        }
        return [];
    } catch (error) {
        throw error;
    }
};

/**
 * Gửi tin nhắn vào nhóm
 * POST /chat
 */
export const sendChatMessage = async (dto: SendChatMessageDto): Promise<ChatMessage> => {
    try {
        const res = await postAccess('chat', dto);
        if (res?.data) {
            return res.data;
        }
        return res;
    } catch (error) {
        throw error;
    }
};

/**
 * Đánh dấu tin nhắn đã đọc
 * PATCH /chat/:id/read
 */
export const markMessageAsRead = async (messageId: number): Promise<ChatMessage> => {
    try {
        const res = await patchAccess(`chat/${messageId}/read`, {});
        if (res?.data) {
            return res.data;
        }
        return res;
    } catch (error) {
        throw error;
    }
};
