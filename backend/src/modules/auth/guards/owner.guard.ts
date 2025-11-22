import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OWNER_KEY } from '../../../common/decorators/owner.decorator';
import type { JwtUser } from '../../../common/types/user.type';

@Injectable()
export class OwnerGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Lấy thông tin owner check từ decorator @Owner()
    const ownerConfig = this.reflector.getAllAndOverride<{
      resourceIdParam: string;
      ownerField: string;
      resourceName?: string;
    }>(OWNER_KEY, [context.getHandler(), context.getClass()]);

    // Nếu không có @Owner() decorator, skip guard này
    if (!ownerConfig) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: JwtUser = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Admin có thể bypass owner check
    if (user.role === 'admin') {
      return true;
    }

    // Lấy resource từ request (cần load trong controller/interceptor trước)
    // Hoặc có thể inject repository để load entity
    const resource = request.resource;
    if (!resource) {
      // Nếu resource chưa được load, sẽ cần load trong interceptor hoặc controller
      // Tạm thời return true và để controller tự kiểm tra
      return true;
    }

    // Kiểm tra owner
    const ownerId = resource[ownerConfig.ownerField];
    if (ownerId !== user.id) {
      const resourceName = ownerConfig.resourceName || 'resource';
      throw new ForbiddenException(
        `You are not the owner of this ${resourceName}`,
      );
    }

    return true;
  }
}

