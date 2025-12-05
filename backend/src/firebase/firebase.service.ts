import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { getMessaging } from 'firebase-admin/messaging';

@Injectable()
export class FirebaseService implements OnModuleInit {
    onModuleInit() {
        const serviceAccountB64 = process.env.FIREBASE_ACCOUNT_B64;
        const serviceAccountJson = serviceAccountB64
            ? Buffer.from(serviceAccountB64, 'base64').toString('utf8')
            : process.env.FIREBASE_ACCOUNT_JSON;

        if (!serviceAccountJson) {
            throw new Error('❌ FIREBASE_ACCOUNT_JSON/FIREBASE_ACCOUNT_B64 not found in env');
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
     * Gửi notification đến 1 thiết bị
     */
    async sendNotification(token: string, title: string, body: string, data?: Record<string, string>) {
        const message = {
            notification: { title, body },
            token,
            data,
        };

        try {
            const response = await getMessaging().send(message);
            console.log('✅ Notification sent:', response);
            return response;
        } catch (error) {
            console.error('❌ Error sending notification:', error);
            throw error;
        }
    }
}
