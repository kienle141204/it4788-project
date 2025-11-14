// import { Controller, Post, Body } from '@nestjs/common';
// import { FirebaseService } from '../firebase/firebase.service';

// @Controller('notification')
// export class NotificationController {
//     constructor(private firebaseService: FirebaseService) { }

//     @Post('send')
//     async send(@Body() dto: { token: string; title: string; body: string }) {
//         return this.firebaseService.sendNotification(
//             dto.token,
//             dto.title,
//             dto.body,
//         );
//     }
// }
