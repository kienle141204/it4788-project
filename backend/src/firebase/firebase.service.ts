// import { Injectable, OnModuleInit } from '@nestjs/common';
// import * as admin from 'firebase-admin';
// import { getMessaging } from 'firebase-admin/messaging';
// import { join } from 'path';

// @Injectable()
// export class FirebaseService implements OnModuleInit {
//     onModuleInit() {
//         // Đường dẫn file .json từ biến môi trường
//         const filePath = process.env.FIREBASE_ACCOUNT_KEY;

//         if (!filePath) {
//             throw new Error('❌ FIREBASE_ACCOUNT_KEY not found in .env');
//         }

//         // ✅ Lấy đường dẫn tuyệt đối để tránh lỗi khi chạy ở các môi trường khác nhau
//         const absolutePath = join(process.cwd(), filePath);
//         const serviceAccount = require(absolutePath);

//         // Khởi tạo Firebase app nếu chưa có
//         if (!admin.apps.length) {
//             admin.initializeApp({
//                 credential: admin.credential.cert(serviceAccount),
//             });
//             console.log('✅ Firebase Admin initialized');
//         }
//     }

//     /**
//      * Gửi notification đến 1 thiết bị
//      */
//     async sendNotification(token: string, title: string, body: string, data?: Record<string, string>) {
//         const message = {
//             notification: { title, body },
//             token,
//             data,
//         };

//         try {
//             const response = await getMessaging().send(message);
//             console.log('✅ Notification sent:', response);
//             return response;
//         } catch (error) {
//             console.error('❌ Error sending notification:', error);
//             throw error;
//         }
//     }
// }
