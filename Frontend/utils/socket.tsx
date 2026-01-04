import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_DOMAIN } from './api';

const getSocketUrl = () => {
    // Kiểm tra xem API_DOMAIN có phải Render URL không
    const isProduction = API_DOMAIN && (API_DOMAIN.includes('render.com') || API_DOMAIN.includes('onrender.com'));

    if (isProduction) {
        // Production: sử dụng WSS (WebSocket Secure) cho HTTPS
        return 'wss://it4788-project-ttac.onrender.com';
    }

    // Development - localhost
    // Trên điện thoại thật với Expo, cần dùng IP máy tính thay vì localhost
    if (Platform.OS === 'web') {
        return 'http://localhost:8090';
    } else if (Platform.OS === 'android') {
        // Android emulator: 10.0.2.2 là alias cho localhost của máy host
        // Android thật: cần IP thực của máy tính (ví dụ: 192.168.1.x)
        // Tạm thời dùng 10.0.2.2 cho emulator, sẽ cần config IP cho thiết bị thật
        return 'http://10.0.2.2:8090';
    } else {
        // iOS simulator: localhost
        // iOS thật: cần IP thực của máy tính
        return 'http://localhost:8090';
    }
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

    // Determine if we should use secure WebSocket
    const isSecure = SOCKET_URL.startsWith('wss://') || SOCKET_URL.startsWith('https://');
    
    chatSocket = io(`${SOCKET_URL}/chat`, {
        auth: {
            token: cleanToken,
        },
        // Use polling as fallback for better compatibility on mobile devices
        transports: ['websocket', 'polling'],
        // Force websocket first, but allow fallback to polling if needed
        upgrade: true,
        rememberUpgrade: true,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: Infinity, // Keep trying to reconnect
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000, // Increase timeout for mobile networks
        forceNew: false, // Reuse existing connection if available
    });

    return new Promise((resolve, reject) => {
        if (!chatSocket) {
            reject(new Error('Socket not initialized'));
            return;
        }

        chatSocket.on('connect', () => {
            hasConnected = true;
            connectionError = null;
            console.log('[Socket] Connected to chat namespace', {
                transport: chatSocket?.io?.engine?.transport?.name,
                url: SOCKET_URL
            });
            resolve(chatSocket!);
        });

        let hasConnected = false;
        let connectionError: Error | null = null;

        chatSocket.on('connect_error', (error) => {
            connectionError = error;
            console.error('[Socket] Connection error:', {
                message: error.message,
                type: error.type,
                description: error.description,
                url: SOCKET_URL,
                transport: chatSocket?.io?.engine?.transport?.name
            });
            // Don't reject immediately, let reconnection handle it
            // Socket.io will automatically retry with different transports
            console.log('[Socket] Will retry connection...');
        });

        chatSocket.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
            // If it's a transport error, socket.io will automatically try to reconnect
            if (reason === 'io server disconnect') {
                // Server disconnected, need to manually reconnect
                console.log('[Socket] Server disconnected, will reconnect...');
            }
        });

        chatSocket.on('reconnect_attempt', (attemptNumber) => {
            console.log('[Socket] Reconnection attempt:', attemptNumber);
        });

        chatSocket.on('reconnect', (attemptNumber) => {
            console.log('[Socket] Reconnected after', attemptNumber, 'attempts');
        });

        chatSocket.on('reconnect_error', (error) => {
            console.error('[Socket] Reconnection error:', error.message);
        });

        chatSocket.on('reconnect_failed', () => {
            console.error('[Socket] Reconnection failed after all attempts');
            // Only reject if we haven't connected yet
            if (!hasConnected) {
                reject(new Error('Socket reconnection failed'));
            }
        });

        // Timeout after 30 seconds (increased for mobile networks)
        const timeoutId = setTimeout(() => {
            if (!hasConnected && !chatSocket?.connected) {
                console.error('[Socket] Connection timeout after 30 seconds');
                const errorMsg = connectionError 
                    ? `Socket connection timeout: ${connectionError.message}`
                    : 'Socket connection timeout';
                reject(new Error(errorMsg));
            }
        }, 30000);

        // Clear timeout if connection succeeds
        chatSocket.once('connect', () => {
            clearTimeout(timeoutId);
        });
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
