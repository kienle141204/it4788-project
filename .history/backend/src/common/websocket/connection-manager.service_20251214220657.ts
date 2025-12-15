import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';

/**
 * Service quản lý tất cả WebSocket connections
 * Có thể được sử dụng bởi nhiều gateway (notifications, chat, etc.)
 */
@Injectable()
export class ConnectionManagerService {
  private readonly logger = new Logger(ConnectionManagerService.name);
  
  // Map user_id -> Set of socket_ids
  private userSockets = new Map<number, Set<string>>();
  
  // Map socket_id -> user_id (để dễ dàng cleanup khi disconnect)
  private socketToUser = new Map<string, number>();

  /**
   * Thêm socket connection cho user
   */
  addConnection(userId: number, socketId: string): void {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)?.add(socketId);
    this.socketToUser.set(socketId, userId);
    
    this.logger.log(`User ${userId} connected with socket ${socketId}`);
    this.logger.log(`Total sockets for user ${userId}: ${this.userSockets.get(userId)?.size}`);
  }

  /**
   * Xóa socket connection
   */
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

  /**
   * Lấy số lượng connections của user
   */
  getUserConnectionCount(userId: number): number {
    return this.userSockets.get(userId)?.size || 0;
  }

  /**
   * Lấy tất cả online users
   */
  getOnlineUsers(): number[] {
    return Array.from(this.userSockets.keys());
  }

  /**
   * Lấy tổng số connections
   */
  getTotalConnections(): number {
    return this.socketToUser.size;
  }

  /**
   * Xóa tất cả connections của user (khi user logout hoặc bị ban)
   */
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

