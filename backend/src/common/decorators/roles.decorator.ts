import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator để chỉ định các roles được phép truy cập endpoint
 * @param roles Danh sách roles được phép ('admin', 'user', ...)
 * @example @Roles('admin') - Chỉ admin mới được truy cập
 * @example @Roles('admin', 'user') - Cả admin và user đều được truy cập
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

