import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../../common/decorators/roles.decorator';
import type { JwtUser } from '../../../common/types/user.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Lấy danh sách roles được phép từ decorator @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Nếu không có @Roles() decorator, cho phép tất cả (skip guard này)
    if (!requiredRoles) {
      return true;
    }

    // Lấy user từ request (đã được authenticate bởi JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user: JwtUser = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Kiểm tra xem user có role trong danh sách được phép không
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException(
        `You need one of these roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}

