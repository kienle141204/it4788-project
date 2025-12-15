import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class ConnectionManagerService {
  private readonly logger = new Logger(ConnectionManagerService.name);
  

  private userSockets = new Map<number, Set<string>>();
  

  private socketToUser = new Map<string, number>();

  addConnection(userId: number, socketId: string): void {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)?.add(socketId);
    this.socketToUser.set(socketId, userId);
    
    this.logger.log(`User ${userId} connected with socket ${socketId}`);
    this.logger.log(`Total sockets for user ${userId}: ${this.userSockets.get(userId)?.size}`);
  }

  removeConnection(socketId: string): number | null {
    const userId = this.socketToUser.get(socketId);
    if (!userId) {
      return null;
    }

    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    this.socketToUser.delete(socketId);

    this.logger.log(`User ${userId} disconnected socket ${socketId}`);
    return userId;
  }

  /**
   * Lấy tất cả socket IDs của user
   */
  getUserSockets(userId: number): Set<string> | undefined {
    return this.userSockets.get(userId);
  }

  /**
   * Kiểm tra user có đang online không
   */
  isUserOnline(userId: number): boolean {
    const sockets = this.userSockets.get(userId);
    return sockets !== undefined && sockets.size > 0;
  }


  getUserConnectionCount(userId: number): number {
    return this.userSockets.get(userId)?.size || 0;
  }


  getOnlineUsers(): number[] {
    return Array.from(this.userSockets.keys());
  }


  getTotalConnections(): number {
    return this.socketToUser.size;
  }

 
  removeAllUserConnections(userId: number): void {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach((socketId) => {
        this.socketToUser.delete(socketId);
      });
      this.userSockets.delete(userId);
      this.logger.log(`Removed all connections for user ${userId}`);
    }
  }
}

