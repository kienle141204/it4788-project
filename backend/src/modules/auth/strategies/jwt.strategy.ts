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
    console.log('JWT Strategy initialized with secret:', secret ? `${secret.substring(0, 10)}...` : 'undefined');
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    console.log('JWT validate payload:', { sub: payload.sub, email: payload.email });
    const user = await this.authService.validateUser(payload);
    if (!user) {
      console.log('JWT validate failed: user not found');
      throw new UnauthorizedException();
    }
    console.log('JWT validate success:', { userId: user.id, email: user.email });
    return user;
  }
}
