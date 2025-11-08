// import { Injectable } from '@nestjs/common';
// import * as admin from 'firebase-admin';
// import { getMessaging } from 'firebase-admin/messaging';

// @Injectable()
// export class FirebaseService {
//     constructor() {
//         const serviceAccount = require('../../firebase-admin.json');

//         if (!admin.apps.length) {
//             admin.initializeApp({
//                 credential: admin.credential.cert(serviceAccount),
//             });
//         }
//     }

//     async sendNotification(token: string, title: string, body: string) {
//         const message = {
//             notification: { title, body },
//             token,
//         };

//         return await getMessaging().send(message);
//     }
// }
