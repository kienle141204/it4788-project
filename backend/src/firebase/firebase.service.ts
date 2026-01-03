import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { getMessaging } from 'firebase-admin/messaging';
import { join } from 'path';
import { readFileSync } from 'fs';

// Interface để tránh circular dependency
export interface DeviceTokenServiceInterface {
    removeInvalidToken(token: string): Promise<void>;
    getUserTokens(userId: number): Promise<Array<{ deviceToken: string; [key: string]: any }>>;
}

@Injectable()
export class FirebaseService implements OnModuleInit {
    private deviceTokenService: DeviceTokenServiceInterface | null = null;

    /**
     * Set device token service (được gọi từ NotificationsModule để tránh circular dependency)
     */
    setDeviceTokenService(service: DeviceTokenServiceInterface) {
        this.deviceTokenService = service;
    }

    onModuleInit() {
        try {
            const serviceAccountB64 = process.env.FIREBASE_ACCOUNT_B64;
            const serviceAccountJsonEnv = process.env.FIREBASE_ACCOUNT_JSON;
            const serviceAccountKeyPath = process.env.FIREBASE_ACCOUNT_KEY;

            // Ưu tiên: B64 -> JSON env -> đọc file path (giữ backward-compatible)
            let serviceAccountJson: string | undefined;
            if (serviceAccountB64) {
                console.log('[FirebaseService] 🔧 Using FIREBASE_ACCOUNT_B64');
                serviceAccountJson = Buffer.from(serviceAccountB64, 'base64').toString('utf8');
            } else if (serviceAccountJsonEnv) {
                console.log('[FirebaseService] 🔧 Using FIREBASE_ACCOUNT_JSON');
                serviceAccountJson = serviceAccountJsonEnv;
            } else if (serviceAccountKeyPath) {
                console.log('[FirebaseService] 🔧 Using FIREBASE_ACCOUNT_KEY:', serviceAccountKeyPath);
                // Cho phép dùng đường dẫn (relative hoặc absolute)
                const absolutePath = serviceAccountKeyPath.startsWith('/')
                    ? serviceAccountKeyPath
                    : join(process.cwd(), serviceAccountKeyPath);
                try {
                    serviceAccountJson = readFileSync(absolutePath, 'utf8');
                } catch (fileError: any) {
                    throw new Error(`❌ Cannot read Firebase service account file: ${fileError.message}`);
                }
            }

            if (!serviceAccountJson) {
                throw new Error('❌ FIREBASE_ACCOUNT_JSON/FIREBASE_ACCOUNT_B64/FIREBASE_ACCOUNT_KEY not found in environment variables');
            }

            let serviceAccount: admin.ServiceAccount;
            try {
                serviceAccount = JSON.parse(serviceAccountJson) as admin.ServiceAccount;
                
                // Validate required fields (ServiceAccount uses camelCase in TypeScript, but JSON may use snake_case)
                const parsedJson = JSON.parse(serviceAccountJson) as any;
                const projectId = serviceAccount.projectId || parsedJson.project_id;
                const privateKey = serviceAccount.privateKey || parsedJson.private_key;
                const clientEmail = serviceAccount.clientEmail || parsedJson.client_email;
                
                if (!projectId) {
                    throw new Error('❌ Firebase service account missing project_id/projectId');
                }
                if (!privateKey) {
                    throw new Error('❌ Firebase service account missing private_key/privateKey');
                }
                if (!clientEmail) {
                    throw new Error('❌ Firebase service account missing client_email/clientEmail');
                }
                
                console.log(`[FirebaseService] ✅ Firebase service account loaded for project: ${projectId}`);
            } catch (err: any) {
                throw new Error(
                    `❌ Invalid Firebase service account JSON: ${err.message}. Kiểm tra giá trị env (nếu dùng base64 phải decode đúng, JSON phải đầy đủ ngoặc kép).`,
                );
            }

            // Khởi tạo Firebase app nếu chưa có
            if (!admin.apps.length) {
                admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
                console.log('[FirebaseService] ✅ Firebase Admin SDK initialized successfully');
            } else {
                console.log('[FirebaseService] ℹ️ Firebase Admin SDK already initialized');
            }
        } catch (error: any) {
            console.error('[FirebaseService] ❌ Failed to initialize Firebase:', error.message);
            throw error;
        }
    }

    /**
     * Kiểm tra xem lỗi có phải là invalid/unregistered token không
     */
    private isInvalidTokenError(error: any): boolean {
        if (!error || typeof error !== 'object') {
            return false;
        }

        const errorCode = error.code || error.errorCode;
        const errorMessage = error.message || '';

        // Firebase error codes cho invalid tokens
        const invalidTokenCodes = [
            'messaging/invalid-registration-token',
            'messaging/registration-token-not-registered',
            'messaging/invalid-argument',
        ];

        return (
            invalidTokenCodes.includes(errorCode) ||
            errorMessage.includes('Invalid registration token') ||
            errorMessage.includes('not registered') ||
            errorMessage.includes('invalid argument')
        );
    }

    /**
     * Xử lý lỗi token và xóa token không hợp lệ khỏi DB
     */
    private async handleTokenError(error: any, token: string): Promise<void> {
        if (this.isInvalidTokenError(error)) {
            if (this.deviceTokenService) {
                try {
                    await this.deviceTokenService.removeInvalidToken(token);
                } catch (removeError) {
                }
            }
        }
    }

    /**
     * Gửi notification đến 1 thiết bị
     * Sử dụng data-only message để frontend control UI hoàn toàn bằng Notifee
     */
    async sendNotification(
        token: string,
        title: string,
        body: string,
        data?: Record<string, string>,
        image?: string,
        icon?: string,
    ) {
        // Chuẩn bị data payload (bao gồm title, body, image để frontend tự tạo notification)
        const dataPayload: Record<string, string> = {
            title,
            body,
            ...(data || {}),
        };

        // Thêm image vào data để frontend có thể lấy
        if (image) {
            dataPayload.image = image;
        }

        // Hybrid message: có cả notification và data payload
        // Notification payload: đảm bảo notification hiển thị khi app ở background
        // Data payload: cho phép frontend customize notification khi app ở foreground
        const message: any = {
            token,
            // Notification payload để đảm bảo hiển thị khi app ở background
            notification: {
                title,
                body,
                ...(image && { imageUrl: image }),
            },
            // Data payload để frontend có thể customize
            data: this.convertDataToString(dataPayload),
            // Android config
            android: {
                priority: 'high' as const,
                notification: {
                    title,
                    body,
                    channelId: 'chat_messages_v2', // Channel ID phải match với frontend
                    sound: 'default',
                    ...(image && { imageUrl: image }),
                },
            },
            // APNS config cho iOS
            apns: {
                payload: {
                    aps: {
                        alert: {
                            title,
                            body,
                        },
                        sound: 'default',
                        badge: 1,
                        contentAvailable: true, // Cho phép xử lý data khi app ở background
                    },
                },
                headers: {
                    'apns-priority': '10', // High priority để đảm bảo delivery
                },
                fcmOptions: {
                    imageUrl: image,
                },
            },
        };

        try {
            const messagingInstance = getMessaging();
            if (!messagingInstance) {
                throw new Error('Firebase Messaging instance is not available');
            }
            
            console.log(`[FirebaseService] 📤 Sending notification to token: ${token.substring(0, 20)}...`);
            console.log(`[FirebaseService] 📝 Title: ${title}, Body: ${body.substring(0, 50)}...`);
            
            const response = await messagingInstance.send(message);
            console.log(`[FirebaseService] ✅ Notification sent successfully: ${response}`);
            return response;
        } catch (error: any) {
            console.error(`[FirebaseService] ❌ Error sending notification:`, error.message || error);
            console.error(`[FirebaseService] ❌ Error code:`, error.code || 'unknown');
            await this.handleTokenError(error, token);
            throw error;
        }
    }

    /**
     * Gửi notification đến tất cả devices của một user
     */
    async sendToUser(
        userId: number,
        title: string,
        body: string,
        data?: Record<string, string>,
        image?: string,
        icon?: string,
    ): Promise<{ success: number; failed: number; errors: string[] }> {
        if (!this.deviceTokenService) {
            console.warn(`[FirebaseService] ⚠️ DeviceTokenService not available for user ${userId}`);
            return { success: 0, failed: 0, errors: ['DeviceTokenService not available'] };
        }

        try {
            const deviceTokens = await this.deviceTokenService.getUserTokens(userId);
            console.log(`[FirebaseService] 📱 Found ${deviceTokens.length} device token(s) for user ${userId}`);
            if (deviceTokens.length === 0) {
                console.log(`[FirebaseService] ℹ️ No device tokens found for user ${userId}`);
                return { success: 0, failed: 0, errors: [] };
            }

            const tokens = deviceTokens.map((dt) => dt.deviceToken);
            console.log(`[FirebaseService] 📤 Sending to ${tokens.length} device(s) for user ${userId}`);
            return await this.sendToMultipleTokens(tokens, title, body, data, image, icon);
        } catch (error) {
            return { success: 0, failed: 0, errors: [error.message || 'Unknown error'] };
        }
    }

    /**
     * Gửi notification đến nhiều tokens
     */
    async sendToMultipleTokens(
        tokens: string[],
        title: string,
        body: string,
        data?: Record<string, string>,
        image?: string,
        icon?: string,
    ): Promise<{ success: number; failed: number; errors: string[] }> {
        if (tokens.length === 0) {
            return { success: 0, failed: 0, errors: [] };
        }

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[],
        };

        // Gửi đến từng token và xử lý lỗi riêng biệt
        const promises = tokens.map(async (token) => {
            try {
                await this.sendNotification(token, title, body, data, image, icon);
                results.success++;
            } catch (error: any) {
                results.failed++;
                const errorMsg = error.message || error.code || 'Unknown error';
                results.errors.push(`Token ${token.substring(0, 20)}...: ${errorMsg}`);
                // handleTokenError đã được gọi trong sendNotification
            }
        });

        await Promise.allSettled(promises);

        console.log(
            `[FirebaseService] 📊 Push notification results: ${results.success} success, ${results.failed} failed`,
        );
        if (results.errors.length > 0) {
            console.warn(`[FirebaseService] ⚠️ Push notification errors:`, results.errors);
        }
        return results;
    }

    /**
     * Gửi notification đến nhiều users
     */
    async sendToMultipleUsers(
        userIds: number[],
        title: string,
        body: string,
        data?: Record<string, string>,
        image?: string,
        icon?: string,
    ): Promise<{ success: number; failed: number; errors: string[] }> {
        if (!this.deviceTokenService) {
            return { success: 0, failed: 0, errors: ['DeviceTokenService not available'] };
        }

        const allTokens: string[] = [];
        const errors: string[] = [];

        // Lấy tất cả tokens của các users
        for (const userId of userIds) {
            try {
                const deviceTokens = await this.deviceTokenService.getUserTokens(userId);
                allTokens.push(...deviceTokens.map((dt) => dt.deviceToken));
            } catch (error: any) {
                errors.push(`User ${userId}: ${error.message || 'Unknown error'}`);
            }
        }

        if (allTokens.length === 0) {
            return { success: 0, failed: 0, errors };
        }

        // Gửi đến tất cả tokens
        const sendResults = await this.sendToMultipleTokens(allTokens, title, body, data, image, icon);
        return {
            success: sendResults.success,
            failed: sendResults.failed,
            errors: [...errors, ...sendResults.errors],
        };
    }

    /**
     * Chuyển đổi data object thành string (FCM yêu cầu data values phải là string)
     */
    private convertDataToString(data: Record<string, string>): Record<string, string> {
        const result: Record<string, string> = {};
        for (const [key, value] of Object.entries(data)) {
            result[key] = typeof value === 'string' ? value : JSON.stringify(value);
        }
        return result;
    }
}
