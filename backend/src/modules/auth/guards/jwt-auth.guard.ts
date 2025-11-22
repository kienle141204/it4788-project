import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    console.log('JWT Guard - Authorization header:', authHeader ? `${authHeader.substring(0, 20)}...` : 'missing');
    
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      console.log('JWT Guard - Authentication failed:', { err: err?.message, info: info?.message });
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
