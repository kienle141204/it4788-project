import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const secret = configService.get<string>('JWT_SECRET') || 'default-secret';
    
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Ưu tiên lấy từ Authorization: Bearer <token> (chuẩn)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // Hỗ trợ lấy từ header access_token hoặc access-token
        // Lưu ý: Express/NestJS normalize headers thành lowercase và chuyển dấu gạch ngang thành dấu gạch dưới
        (request: any) => {
          if (!request || !request.headers) return null;
          // Thử các cách khác nhau: access_token, access-token, x-access-token
          const token = 
            request.headers.access_token || 
            request.headers['access-token'] || 
            request.headers['x-access-token'] ||
            request.headers['x_access_token'];
          return token ? (typeof token === 'string' ? token : token[0]) : null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    const user = await this.authService.validateUser(payload);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
