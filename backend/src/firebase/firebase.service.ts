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
        const serviceAccountB64 = process.env.FIREBASE_ACCOUNT_B64;
        const serviceAccountJsonEnv = process.env.FIREBASE_ACCOUNT_JSON;
        const serviceAccountKeyPath = process.env.FIREBASE_ACCOUNT_KEY;

        // Ưu tiên: B64 -> JSON env -> đọc file path (giữ backward-compatible)
        let serviceAccountJson: string | undefined;
        if (serviceAccountB64) {
            serviceAccountJson = Buffer.from(serviceAccountB64, 'base64').toString('utf8');
        } else if (serviceAccountJsonEnv) {
            serviceAccountJson = serviceAccountJsonEnv;
        } else if (serviceAccountKeyPath) {
            // Cho phép dùng đường dẫn (relative hoặc absolute)
            const absolutePath = serviceAccountKeyPath.startsWith('/')
                ? serviceAccountKeyPath
                : join(process.cwd(), serviceAccountKeyPath);
            serviceAccountJson = readFileSync(absolutePath, 'utf8');
        }

        if (!serviceAccountJson) {
            throw new Error('❌ FIREBASE_ACCOUNT_JSON/FIREBASE_ACCOUNT_B64/FIREBASE_ACCOUNT_KEY not found');
        }

        let serviceAccount: admin.ServiceAccount;
        try {
            serviceAccount = JSON.parse(serviceAccountJson) as admin.ServiceAccount;
        } catch (err) {
            throw new Error(
                '❌ Invalid Firebase service account JSON. Kiểm tra giá trị env (nếu dùng base64 phải decode đúng, JSON phải đầy đủ ngoặc kép).',
            );
        }

        // Khởi tạo Firebase app nếu chưa có
        if (!admin.apps.length) {
            admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
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
            console.warn(`⚠️ Invalid token detected: ${token.substring(0, 20)}...`);
            if (this.deviceTokenService) {
                try {
                    await this.deviceTokenService.removeInvalidToken(token);
                    console.log(`✅ Removed invalid token from database`);
                } catch (removeError) {
                    console.error(`❌ Error removing invalid token:`, removeError);
                }
            } else {
                console.warn(`⚠️ DeviceTokenService not available, cannot remove invalid token`);
            }
        }
    }

    /**
     * Gửi notification đến 1 thiết bị
     */
    async sendNotification(token: string, title: string, body: string, data?: Record<string, string>) {
        const message = {
            notification: { title, body },
            token,
            data: data ? this.convertDataToString(data) : undefined,
        };

        try {
            const response = await getMessaging().send(message);
            console.log('✅ Notification sent:', response);
            return response;
        } catch (error) {
            await this.handleTokenError(error, token);
            console.error('❌ Error sending notification:', error);
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
    ): Promise<{ success: number; failed: number; errors: string[] }> {
        if (!this.deviceTokenService) {
            console.warn(`⚠️ DeviceTokenService not available, cannot send to user ${userId}`);
            return { success: 0, failed: 0, errors: ['DeviceTokenService not available'] };
        }

        try {
            const deviceTokens = await this.deviceTokenService.getUserTokens(userId);
            if (deviceTokens.length === 0) {
                console.log(`ℹ️ No device tokens found for user ${userId}`);
                return { success: 0, failed: 0, errors: [] };
            }

            const tokens = deviceTokens.map((dt) => dt.deviceToken);
            return await this.sendToMultipleTokens(tokens, title, body, data);
        } catch (error) {
            console.error(`❌ Error getting tokens for user ${userId}:`, error);
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
                await this.sendNotification(token, title, body, data);
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
            `📊 Push notification results: ${results.success} success, ${results.failed} failed`,
        );
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
    ): Promise<{ success: number; failed: number; errors: string[] }> {
        if (!this.deviceTokenService) {
            console.warn(`⚠️ DeviceTokenService not available, cannot send to multiple users`);
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
            console.log(`ℹ️ No device tokens found for any of the ${userIds.length} users`);
            return { success: 0, failed: 0, errors };
        }

        // Gửi đến tất cả tokens
        const sendResults = await this.sendToMultipleTokens(allTokens, title, body, data);
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
