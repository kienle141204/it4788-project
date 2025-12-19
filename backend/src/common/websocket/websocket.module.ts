import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConnectionManagerService } from './connection-manager.service';
import { WsJwtGuard } from './guards/ws-jwt.guard';

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

