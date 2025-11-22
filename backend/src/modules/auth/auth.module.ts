import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { User } from '../../entities/user.entity';
import { TempUser } from '../../entities/temp-user.entity';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { EmailService } from './services/email.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { OwnerGuard } from './guards/owner.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, TempUser]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET') || 'default-secret';
        console.log('JWT Module initialized with secret:', secret ? `${secret.substring(0, 10)}...` : 'undefined');
        return {
          secret: secret,
          signOptions: { expiresIn: '7d' },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, EmailService, JwtStrategy, JwtAuthGuard, RolesGuard, OwnerGuard],
  exports: [AuthService, JwtAuthGuard, RolesGuard, OwnerGuard],
})
export class AuthModule { }
