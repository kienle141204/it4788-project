import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { DeviceTokenController } from './device-token.controller';
import { DeviceTokenService } from './device-token.service';
import { Notification } from '../../entities/notification.entity';
import { User } from '../../entities/user.entity';
import { DeviceToken } from '../../entities/device-token.entity';
import { WebSocketModule } from '../../common/websocket';
import { FirebaseModule } from '../../firebase/firebase.module';
import { FirebaseService } from '../../firebase/firebase.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User, DeviceToken]),
    WebSocketModule, // Import shared WebSocket module
    FirebaseModule, // Import FirebaseModule để sử dụng FirebaseService
  ],
  controllers: [NotificationsController, DeviceTokenController],
  providers: [NotificationsService, NotificationsGateway, DeviceTokenService],
  exports: [NotificationsService, DeviceTokenService],
})
export class NotificationsModule {
  constructor(
    private firebaseService: FirebaseService,
    private deviceTokenService: DeviceTokenService,
  ) {
    // Thiết lập DeviceTokenService cho FirebaseService để xử lý invalid tokens
    // Sử dụng setter pattern để tránh circular dependency
    if (firebaseService && typeof firebaseService.setDeviceTokenService === 'function') {
      firebaseService.setDeviceTokenService(deviceTokenService);
    }
  }
}

