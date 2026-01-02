import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_DOMAIN } from './api';

const getSocketUrl = () => {
<<<<<<< HEAD
    // if (Platform.OS === 'web') {
    //     return 'http://localhost:8090';
    // } else if (Platform.OS === 'android') {
    //     return 'http://10.0.2.2:8090';
    // } else {
    //     // iOS simulator hoặc các platform khác
    //     return 'http://localhost:8090';
    // }
    return 'https://it4788-project-ttac.onrender.com';
=======
    // Kiểm tra xem API_DOMAIN có phải Render URL không
    const isProduction = API_DOMAIN.includes('render.com') || API_DOMAIN.includes('onrender.com');

    if (isProduction) {
        return 'wss://it4788-project-ttac.onrender.com';
    }

    // Development - localhost
    if (Platform.OS === 'web') {
        return 'http://localhost:8090';
    } else if (Platform.OS === 'android') {
        return 'http://10.0.2.2:8090';
    } else {
        // iOS simulator hoặc các platform khác
        return 'http://localhost:8090';
    }
>>>>>>> 963a64e07cbf036acbd6fe18c591c39168b60646
};

const SOCKET_URL = getSocketUrl();

let chatSocket: Socket | null = null;

/**
 * Kết nối đến chat namespace với JWT authentication
 */
export const connectChatSocket = async (): Promise<Socket> => {
    if (chatSocket?.connected) {
        return chatSocket;
    }

    const token = await AsyncStorage.getItem('access_token');
    const cleanToken = token?.startsWith('Bearer ') ? token.substring(7) : token;

    chatSocket = io(`${SOCKET_URL}/chat`, {
        auth: {
            token: cleanToken,
        },
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    return new Promise((resolve, reject) => {
        if (!chatSocket) {
            reject(new Error('Socket not initialized'));
            return;
        }

        chatSocket.on('connect', () => {
            console.log('[Socket] Connected to chat namespace');
            resolve(chatSocket!);
        });

        chatSocket.on('connect_error', (error) => {
            console.error('[Socket] Connection error:', error.message);
            reject(error);
        });

        chatSocket.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
        });

        // Timeout after 10 seconds
        setTimeout(() => {
            if (!chatSocket?.connected) {
                reject(new Error('Socket connection timeout'));
            }
        }, 10000);
    });
};

/**
 * Ngắt kết nối socket
 */
export const disconnectChatSocket = () => {
    if (chatSocket) {
        chatSocket.disconnect();
        chatSocket = null;
        console.log('[Socket] Disconnected and cleaned up');
    }
};

/**
 * Lấy socket instance hiện tại
 */
export const getChatSocket = (): Socket | null => {
    return chatSocket;
};

/**
 * Join vào room chat của family
 */
export const joinChatRoom = (familyId: number): Promise<{ success: boolean; room?: string; error?: string }> => {
    return new Promise((resolve) => {
        if (!chatSocket?.connected) {
            resolve({ success: false, error: 'Socket not connected' });
            return;
        }

        chatSocket.emit('join_room', { familyId }, (response: any) => {
            console.log('[Socket] Join room response:', response);
            resolve(response);
        });
    });
};

/**
 * Rời khỏi room chat của family
 */
export const leaveChatRoom = (familyId: number): Promise<{ success: boolean }> => {
    return new Promise((resolve) => {
        if (!chatSocket?.connected) {
            resolve({ success: false });
            return;
        }

        chatSocket.emit('leave_room', { familyId }, (response: any) => {
            console.log('[Socket] Leave room response:', response);
            resolve(response);
        });
    });
};

/**
 * Gửi tin nhắn qua WebSocket
 */
export const sendMessageWS = (dto: {
    familyId: number;
    title: string;
    message: string;
    data?: Record<string, any>;
}): Promise<{ success: boolean; messageId?: number; error?: string }> => {
    return new Promise((resolve) => {
        if (!chatSocket?.connected) {
            resolve({ success: false, error: 'Socket not connected' });
            return;
        }

        chatSocket.emit('send_message', dto, (response: any) => {
            console.log('[Socket] Send message response:', response);
            resolve(response);
        });
    });
};

/**
 * Đăng ký lắng nghe tin nhắn mới
 */
export const onNewMessage = (callback: (message: any) => void): (() => void) => {
    if (!chatSocket) {
        return () => { };
    }

    chatSocket.on('new_message', callback);

    // Return unsubscribe function
    return () => {
        chatSocket?.off('new_message', callback);
    };
};

/**
 * Đăng ký lắng nghe user typing
 */
export const onUserTyping = (callback: (data: { userId: number; email: string; isTyping: boolean }) => void): (() => void) => {
    if (!chatSocket) {
        return () => { };
    }

    chatSocket.on('user_typing', callback);

    return () => {
        chatSocket?.off('user_typing', callback);
    };
};

/**
 * Gửi typing indicator
 */
export const sendTyping = (familyId: number, isTyping: boolean) => {
    if (chatSocket?.connected) {
        chatSocket.emit('typing', { familyId, isTyping });
    }
};
