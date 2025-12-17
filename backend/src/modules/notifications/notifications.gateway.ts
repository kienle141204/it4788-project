import {
  WebSocketGateway,
  SubscribeMessage,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UseGuards, Inject, forwardRef } from '@nestjs/common';
import { BaseGateway, ConnectionManagerService, WsJwtGuard } from '../../common/websocket';
import { NotificationsService } from './notifications.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway extends BaseGateway {
  protected readonly namespace = '/notifications';

  constructor(
    connectionManager: ConnectionManagerService,
    wsJwtGuard: WsJwtGuard,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {
    super(connectionManager, wsJwtGuard);
  }

  /**
   * Override onUserConnected để gửi số lượng thông báo chưa đọc khi user kết nối
   */
  protected async onUserConnected(client: Socket, user: any): Promise<void> {
    await super.onUserConnected(client, user);

    // Gửi số lượng thông báo chưa đọc khi user kết nối
    try {
      const unreadCount = await this.notificationsService.getUnreadCount(user.id);
      client.emit('unread_count', unreadCount);
    } catch (error) {
      this.logger.error(`Error getting unread count for user ${user.id}:`, error);
    }
  }

  /**
   * Emit thông báo mới đến user cụ thể
   */
  emitNotificationToUser(userId: number, notification: any): void {
    this.emitToUser(userId, 'new_notification', notification);
  }

  /**
   * Emit số lượng thông báo chưa đọc đến user
   */
  async emitUnreadCountToUser(userId: number): Promise<void> {
    try {
      const unreadCount = await this.notificationsService.getUnreadCount(userId);
      this.emitToUser(userId, 'unread_count', unreadCount);
    } catch (error) {
      this.logger.error(`Error emitting unread count to user ${userId}:`, error);
    }
  }

  /**
   * Client có thể subscribe để nhận thông báo
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('subscribe')
  handleSubscribe(@ConnectedSocket() client: Socket) {
    const user = client.data.user;
    this.logger.log(`User ${user.id} subscribed to notifications`);
    return { success: true, message: 'Subscribed to notifications' };
  }

  /**
   * Client có thể request số lượng thông báo chưa đọc
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('get_unread_count')
  async handleGetUnreadCount(@ConnectedSocket() client: Socket) {
    const user = client.data.user;
    try {
      const unreadCount = await this.notificationsService.getUnreadCount(user.id);
      client.emit('unread_count', unreadCount);
      return { success: true, data: unreadCount };
    } catch (error) {
      this.logger.error(`Error getting unread count for user ${user.id}:`, error);
      return { success: false, error: 'Failed to get unread count' };
    }
  }
}

