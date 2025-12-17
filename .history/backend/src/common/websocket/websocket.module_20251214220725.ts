import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConnectionManagerService } from './connection-manager.service';
import { WsJwtGuard } from './guards/ws-jwt.guard';

/**
 * WebSocket Module chung
 * Module này cung cấp các service và guard có thể tái sử dụng cho:
 * - Notifications Gateway
 * - Chat Gateway
 * - Và các gateway khác trong tương lai
 * 
 * @Global() decorator cho phép module này được import một lần và sử dụng ở mọi nơi
 */
@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'default-secret',
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  providers: [ConnectionManagerService, WsJwtGuard],
  exports: [ConnectionManagerService, WsJwtGuard, JwtModule],
})
export class WebSocketModule {}

