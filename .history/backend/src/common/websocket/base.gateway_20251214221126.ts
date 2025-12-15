import { Logger, OnModuleInit } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConnectionManagerService } from './connection-manager.service';
import { WsJwtGuard } from './guards/ws-jwt.guard';

/**
 * Base Gateway class để các gateway khác có thể extend
 * Cung cấp các chức năng chung như:
 * - JWT authentication
 * - Connection management
 * - User tracking
 */
export abstract class BaseGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  protected server: Server;

  protected readonly logger: Logger;
  protected abstract readonly namespace: string;

  constructor(
    protected readonly connectionManager: ConnectionManagerService,
    protected readonly wsJwtGuard: WsJwtGuard,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  onModuleInit() {
    this.logger.log(`WebSocket Gateway initialized for namespace: ${this.namespace}`);
  }

  /**
   * Xử lý khi client kết nối
   * Override method này trong gateway con để thêm logic riêng
   */
  async handleConnection(client: Socket) {
    // Authenticate user
    try {
      // Tạo ExecutionContext giả để guard có thể hoạt động
      const context = {
        switchToWs: () => ({
          getClient: () => client,
        }),
        getClass: () => this.constructor,
        getHandler: () => this.handleConnection,
      } as any;

      await this.wsJwtGuard.canActivate(context);
    } catch (error) {
      this.logger.warn(`Client ${client.id} failed authentication: ${error.message}`);
      client.disconnect();
      return;
    }

    const user = client.data.user;
    if (!user) {
      this.logger.warn(`Client ${client.id} connected without user data`);
      client.disconnect();
      return;
    }

    // Thêm vào connection manager
    this.connectionManager.addConnection(user.id, client.id);

    // Gọi method onUserConnected để gateway con có thể xử lý
    await this.onUserConnected(client, user);
  }

  /**
   * Xử lý khi client ngắt kết nối
   */
  async handleDisconnect(client: Socket) {
    const userId = this.connectionManager.removeConnection(client.id);
    if (userId) {
      await this.onUserDisconnected(client, userId);
    }
  }

  /**
   * Method để gateway con override khi user kết nối
   */
  protected async onUserConnected(client: Socket, user: any): Promise<void> {
    this.logger.log(`User ${user.id} (${user.email}) connected to ${this.namespace}`);
  }

  /**
   * Method để gateway con override khi user ngắt kết nối
   */
  protected async onUserDisconnected(client: Socket, userId: number): Promise<void> {
    this.logger.log(`User ${userId} disconnected from ${this.namespace}`);
  }

  /**
   * Emit event đến user cụ thể
   */
  protected emitToUser(userId: number, event: string, data: any): void {
    const sockets = this.connectionManager.getUserSockets(userId);
    if (sockets && sockets.size > 0) {
      sockets.forEach((socketId) => {
        this.server.to(socketId).emit(event, data);
      });
      this.logger.debug(`Emitted ${event} to user ${userId} on ${sockets.size} socket(s)`);
    } else {
      this.logger.debug(`User ${userId} is not connected, event ${event} will not be delivered`);
    }
  }

  /**
   * Emit event đến tất cả users
   */
  protected emitToAll(event: string, data: any): void {
    this.server.emit(event, data);
    this.logger.debug(`Emitted ${event} to all clients`);
  }

  /**
   * Emit event đến room cụ thể
   */
  protected emitToRoom(room: string, event: string, data: any): void {
    this.server.to(room).emit(event, data);
    this.logger.debug(`Emitted ${event} to room ${room}`);
  }
}

