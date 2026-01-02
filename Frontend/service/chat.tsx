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

export interface ChatPagination {
    limit: number;
    lastId: number | null;
    hasMore: boolean;
}

export interface ChatMessagesResponse {
    data: ChatMessage[];
    pagination: ChatPagination;
}

/**
 * Lấy danh sách tin nhắn của nhóm (có pagination)
 * GET /chat/family/:familyId?limit=30&lastId=xxx
 */
export const getChatMessages = async (
    familyId: number,
    limit: number = 30,
    lastId?: number
): Promise<ChatMessagesResponse> => {
    try {
        let url = `chat/family/${familyId}?limit=${limit}`;
        if (lastId) {
            url += `&lastId=${lastId}`;
        }
        const res = await getAccess(url);

        // Handle new paginated response format
        if (res?.data && res?.pagination) {
            return res;
        }

        // Fallback for old format (array response)
        if (Array.isArray(res)) {
            return {
                data: res,
                pagination: { limit, lastId: null, hasMore: false },
            };
        }
        if (Array.isArray(res?.data)) {
            return {
                data: res.data,
                pagination: res.pagination || { limit, lastId: null, hasMore: false },
            };
        }
        return { data: [], pagination: { limit, lastId: null, hasMore: false } };
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

// Re-export WebSocket functions for convenient imports
export {
    connectChatSocket,
    disconnectChatSocket,
    getChatSocket,
    joinChatRoom,
    leaveChatRoom,
    sendMessageWS,
    onNewMessage,
    onUserTyping,
    sendTyping,
} from '../utils/socket';
