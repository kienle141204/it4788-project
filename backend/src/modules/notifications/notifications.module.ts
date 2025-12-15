import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { Notification } from '../../entities/notification.entity';
import { User } from '../../entities/user.entity';
import { WebSocketModule } from '../../common/websocket';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User]),
    WebSocketModule, // Import shared WebSocket module
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway],
  exports: [NotificationsService],
})
export class NotificationsModule {}

