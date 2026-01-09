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

// ==================== Shopping List Socket ====================

let shoppingListSocket: Socket | null = null;

/**
 * Kết nối đến shopping-list namespace với JWT authentication
 */
export const connectShoppingListSocket = async (): Promise<Socket> => {
    if (shoppingListSocket?.connected) {
        return shoppingListSocket;
    }

    const token = await AsyncStorage.getItem('access_token');
    const cleanToken = token?.startsWith('Bearer ') ? token.substring(7) : token;

    shoppingListSocket = io(`${SOCKET_URL}/shopping-list`, {
        auth: {
            token: cleanToken,
        },
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: false,
    });

    return new Promise((resolve, reject) => {
        if (!shoppingListSocket) {
            reject(new Error('Socket not initialized'));
            return;
        }

        let hasConnected = false;
        let connectionError: Error | null = null;

        shoppingListSocket.on('connect', () => {
            hasConnected = true;
            connectionError = null;
            console.log('[Socket] Connected to shopping-list namespace');
            // Auto subscribe when connected
            shoppingListSocket?.emit('subscribe');
            resolve(shoppingListSocket!);
        });

        shoppingListSocket.on('connect_error', (error) => {
            connectionError = error;
            console.error('[Socket] Shopping list connection error:', error.message);
        });

        shoppingListSocket.on('disconnect', (reason) => {
            console.log('[Socket] Shopping list disconnected:', reason);
        });

        shoppingListSocket.on('reconnect', () => {
            console.log('[Socket] Shopping list reconnected');
            shoppingListSocket?.emit('subscribe');
        });

        const timeoutId = setTimeout(() => {
            if (!hasConnected && !shoppingListSocket?.connected) {
                const errorMsg = connectionError 
                    ? `Socket connection timeout: ${connectionError.message}`
                    : 'Socket connection timeout';
                reject(new Error(errorMsg));
            }
        }, 30000);

        shoppingListSocket.once('connect', () => {
            clearTimeout(timeoutId);
        });
    });
};

/**
 * Ngắt kết nối shopping-list socket
 */
export const disconnectShoppingListSocket = () => {
    if (shoppingListSocket) {
        shoppingListSocket.disconnect();
        shoppingListSocket = null;
        console.log('[Socket] Shopping list socket disconnected');
    }
};

/**
 * Lấy shopping-list socket instance
 */
export const getShoppingListSocket = (): Socket | null => {
    return shoppingListSocket;
};

/**
 * Join vào family room cho shopping-list
 */
export const joinShoppingListFamily = (familyId: number): Promise<{ success: boolean; message?: string; error?: string }> => {
    return new Promise((resolve) => {
        if (!shoppingListSocket?.connected) {
            resolve({ success: false, error: 'Socket not connected' });
            return;
        }

        shoppingListSocket.emit('join_family', { familyId }, (response: any) => {
            console.log('[Socket] Join shopping family room response:', response);
            resolve(response || { success: true });
        });
    });
};

/**
 * Rời khỏi family room cho shopping-list
 */
export const leaveShoppingListFamily = (familyId: number): Promise<{ success: boolean; message?: string }> => {
    return new Promise((resolve) => {
        if (!shoppingListSocket?.connected) {
            resolve({ success: false });
            return;
        }

        shoppingListSocket.emit('leave_family', { familyId }, (response: any) => {
            console.log('[Socket] Leave shopping family room response:', response);
            resolve(response || { success: true });
        });
    });
};

/**
 * Đăng ký lắng nghe shopping list events
 */
export const onShoppingListEvent = (eventName: string, callback: (data: any) => void): (() => void) => {
    if (!shoppingListSocket) {
        return () => { };
    }

    shoppingListSocket.on(eventName, callback);

    return () => {
        shoppingListSocket?.off(eventName, callback);
    };
};

// ==================== Refrigerator Socket ====================

let refrigeratorSocket: Socket | null = null;

/**
 * Kết nối đến refrigerator namespace với JWT authentication
 */
export const connectRefrigeratorSocket = async (): Promise<Socket> => {
    if (refrigeratorSocket?.connected) {
        return refrigeratorSocket;
    }

    const token = await AsyncStorage.getItem('access_token');
    const cleanToken = token?.startsWith('Bearer ') ? token.substring(7) : token;

    refrigeratorSocket = io(`${SOCKET_URL}/refrigerator`, {
        auth: {
            token: cleanToken,
        },
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: false,
    });

    return new Promise((resolve, reject) => {
        if (!refrigeratorSocket) {
            reject(new Error('Socket not initialized'));
            return;
        }

        let hasConnected = false;
        let connectionError: Error | null = null;

        refrigeratorSocket.on('connect', () => {
            hasConnected = true;
            connectionError = null;
            console.log('[Socket] Connected to refrigerator namespace');
            // Auto subscribe when connected
            refrigeratorSocket?.emit('subscribe');
            resolve(refrigeratorSocket!);
        });

        refrigeratorSocket.on('connect_error', (error) => {
            connectionError = error;
            console.error('[Socket] Refrigerator connection error:', error.message);
        });

        refrigeratorSocket.on('disconnect', (reason) => {
            console.log('[Socket] Refrigerator disconnected:', reason);
        });

        refrigeratorSocket.on('reconnect', () => {
            console.log('[Socket] Refrigerator reconnected');
            refrigeratorSocket?.emit('subscribe');
        });

        const timeoutId = setTimeout(() => {
            if (!hasConnected && !refrigeratorSocket?.connected) {
                const errorMsg = connectionError 
                    ? `Socket connection timeout: ${connectionError.message}`
                    : 'Socket connection timeout';
                reject(new Error(errorMsg));
            }
        }, 30000);

        refrigeratorSocket.once('connect', () => {
            clearTimeout(timeoutId);
        });
    });
};

/**
 * Ngắt kết nối refrigerator socket
 */
export const disconnectRefrigeratorSocket = () => {
    if (refrigeratorSocket) {
        refrigeratorSocket.disconnect();
        refrigeratorSocket = null;
        console.log('[Socket] Refrigerator socket disconnected');
    }
};

/**
 * Lấy refrigerator socket instance
 */
export const getRefrigeratorSocket = (): Socket | null => {
    return refrigeratorSocket;
};

/**
 * Join vào family room cho refrigerator
 */
export const joinRefrigeratorFamily = (familyId: number): Promise<{ success: boolean; message?: string; error?: string }> => {
    return new Promise((resolve) => {
        if (!refrigeratorSocket?.connected) {
            resolve({ success: false, error: 'Socket not connected' });
            return;
        }

        refrigeratorSocket.emit('join_family', { familyId }, (response: any) => {
            console.log('[Socket] Join refrigerator family room response:', response);
            resolve(response || { success: true });
        });
    });
};

/**
 * Rời khỏi family room cho refrigerator
 */
export const leaveRefrigeratorFamily = (familyId: number): Promise<{ success: boolean; message?: string }> => {
    return new Promise((resolve) => {
        if (!refrigeratorSocket?.connected) {
            resolve({ success: false });
            return;
        }

        refrigeratorSocket.emit('leave_family', { familyId }, (response: any) => {
            console.log('[Socket] Leave refrigerator family room response:', response);
            resolve(response || { success: true });
        });
    });
};

/**
 * Đăng ký lắng nghe refrigerator events
 */
export const onRefrigeratorEvent = (eventName: string, callback: (data: any) => void): (() => void) => {
    if (!refrigeratorSocket) {
        return () => { };
    }

    refrigeratorSocket.on(eventName, callback);

    return () => {
        refrigeratorSocket?.off(eventName, callback);
    };
};

// ==================== Menu Socket ====================

let menuSocket: Socket | null = null;

/**
 * Kết nối đến menu namespace với JWT authentication
 */
export const connectMenuSocket = async (): Promise<Socket> => {
    if (menuSocket?.connected) {
        return menuSocket;
    }

    const token = await AsyncStorage.getItem('access_token');
    const cleanToken = token?.startsWith('Bearer ') ? token.substring(7) : token;

    menuSocket = io(`${SOCKET_URL}/menu`, {
        auth: {
            token: cleanToken,
        },
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: false,
    });

    return new Promise((resolve, reject) => {
        if (!menuSocket) {
            reject(new Error('Socket not initialized'));
            return;
        }

        let hasConnected = false;
        let connectionError: Error | null = null;

        menuSocket.on('connect', () => {
            hasConnected = true;
            connectionError = null;
            console.log('[Socket] Connected to menu namespace');
            // Auto subscribe when connected
            menuSocket?.emit('subscribe');
            resolve(menuSocket!);
        });

        menuSocket.on('connect_error', (error) => {
            connectionError = error;
            console.error('[Socket] Menu connection error:', error.message);
        });

        menuSocket.on('disconnect', (reason) => {
            console.log('[Socket] Menu disconnected:', reason);
        });

        menuSocket.on('reconnect', () => {
            console.log('[Socket] Menu reconnected');
            menuSocket?.emit('subscribe');
        });

        const timeoutId = setTimeout(() => {
            if (!hasConnected && !menuSocket?.connected) {
                const errorMsg = connectionError 
                    ? `Socket connection timeout: ${connectionError.message}`
                    : 'Socket connection timeout';
                reject(new Error(errorMsg));
            }
        }, 30000);

        menuSocket.once('connect', () => {
            clearTimeout(timeoutId);
        });
    });
};

/**
 * Ngắt kết nối menu socket
 */
export const disconnectMenuSocket = () => {
    if (menuSocket) {
        menuSocket.disconnect();
        menuSocket = null;
        console.log('[Socket] Menu socket disconnected');
    }
};

/**
 * Lấy menu socket instance
 */
export const getMenuSocket = (): Socket | null => {
    return menuSocket;
};

/**
 * Join vào family room cho menu
 */
export const joinMenuFamily = (familyId: number): Promise<{ success: boolean; message?: string; error?: string }> => {
    return new Promise((resolve) => {
        if (!menuSocket?.connected) {
            resolve({ success: false, error: 'Socket not connected' });
            return;
        }

        menuSocket.emit('join_family', { familyId }, (response: any) => {
            console.log('[Socket] Join menu family room response:', response);
            resolve(response || { success: true });
        });
    });
};

/**
 * Rời khỏi family room cho menu
 */
export const leaveMenuFamily = (familyId: number): Promise<{ success: boolean; message?: string }> => {
    return new Promise((resolve) => {
        if (!menuSocket?.connected) {
            resolve({ success: false });
            return;
        }

        menuSocket.emit('leave_family', { familyId }, (response: any) => {
            console.log('[Socket] Leave menu family room response:', response);
            resolve(response || { success: true });
        });
    });
};

/**
 * Đăng ký lắng nghe menu events
 */
export const onMenuEvent = (eventName: string, callback: (data: any) => void): (() => void) => {
    if (!menuSocket) {
        return () => { };
    }

    menuSocket.on(eventName, callback);

    return () => {
        menuSocket?.off(eventName, callback);
    };
};
