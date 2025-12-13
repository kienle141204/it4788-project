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
      const resourceIdParam = request.params[idParam];
      if (!resourceIdParam) {
        throw new ForbiddenException(`Missing ${idParam} parameter`);
      }
      
      const resourceId = Number(resourceIdParam);
      if (isNaN(resourceId)) {
        throw new ForbiddenException(`Invalid ${idParam} parameter: must be a number`);
      }
      
      // Convert cả hai về number để đảm bảo so sánh chính xác
      // (user.id có thể là bigint từ database)
      const userId = Number(user.id);
      const targetId = Number(resourceId);
      
      if (userId !== targetId) {
        throw new ForbiddenException('You can only access your own resources');
      }

      return true;
    }
  }

  return SelfOrAdminGuardImpl;
};

