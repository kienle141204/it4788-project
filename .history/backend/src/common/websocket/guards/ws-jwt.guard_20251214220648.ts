import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';

/**
 * JWT Guard cho WebSocket
 * Có thể được sử dụng bởi nhiều gateway (notifications, chat, etc.)
 */
@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const token = this.extractTokenFromSocket(client);

    if (!token) {
      throw new UnauthorizedException('Token không được cung cấp');
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET') || 'default-secret';
      const payload = await this.jwtService.verifyAsync(token, { secret });
      
      // Gắn user info vào socket để sử dụng sau này
      client.data.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
  }

  private extractTokenFromSocket(client: Socket): string | null {
    // Lấy token từ query parameter (ví dụ: ?token=xxx)
    const token = client.handshake.query.token as string;
    if (token) {
      return token;
    }

    // Lấy token từ auth object
    const authToken = client.handshake.auth?.token;
    if (authToken) {
      return authToken;
    }

    // Lấy token từ Authorization header
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }
}

