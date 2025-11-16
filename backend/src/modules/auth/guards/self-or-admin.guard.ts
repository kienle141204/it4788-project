import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import type { JwtUser } from '../../../common/types/user.type';

/**
 * Guard đơn giản để kiểm tra user có phải owner của resource không
 * Sử dụng khi đã có resource trong request (load từ service)
 * 
 * Usage:
 * @UseGuards(JwtAuthGuard, SelfOrAdminGuard('id'))
 * async updateUser(@Param('id') id: number, @User() user: JwtUser) { ... }
 */
export const SelfOrAdminGuard = (idParam: string = 'id') => {
  @Injectable()
  class SelfOrAdminGuardImpl implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest();
      const user: JwtUser = request.user;

      if (!user) {
        throw new ForbiddenException('User not authenticated');
      }

      // Admin có thể bypass
      if (user.role === 'admin') {
        return true;
      }

      // Kiểm tra user có phải chính họ không
      const resourceId = parseInt(request.params[idParam]);
      if (resourceId !== user.id) {
        throw new ForbiddenException('You can only access your own resources');
      }

      return true;
    }
  }

  return SelfOrAdminGuardImpl;
};

