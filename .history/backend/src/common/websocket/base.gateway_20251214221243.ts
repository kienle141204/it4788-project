import { Logger, OnModuleInit } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConnectionManagerService } from './connection-manager.service';
import { WsJwtGuard } from './guards/ws-jwt.guard';


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


  async handleConnection(client: Socket) {
    try {
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

    this.connectionManager.addConnection(user.id, client.id);

    await this.onUserConnected(client, user);
  }

  async handleDisconnect(client: Socket) {
    const userId = this.connectionManager.removeConnection(client.id);
    if (userId) {
      await this.onUserDisconnected(client, userId);
    }
  }


  protected async onUserConnected(client: Socket, user: any): Promise<void> {
    this.logger.log(`User ${user.id} (${user.email}) connected to ${this.namespace}`);
  }

  protected async onUserDisconnected(client: Socket, userId: number): Promise<void> {
    this.logger.log(`User ${userId} disconnected from ${this.namespace}`);
  }


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


  protected emitToAll(event: string, data: any): void {
    this.server.emit(event, data);
    this.logger.debug(`Emitted ${event} to all clients`);
  }

  protected emitToRoom(room: string, event: string, data: any): void {
    this.server.to(room).emit(event, data);
    this.logger.debug(`Emitted ${event} to room ${room}`);
  }
}

