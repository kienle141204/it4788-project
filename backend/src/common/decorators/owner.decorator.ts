import { SetMetadata } from '@nestjs/common';

export const OWNER_KEY = 'owner';

/**
 * Decorator để chỉ định cách kiểm tra owner của resource
 * @param resourceIdParam Tên param chứa resource ID (default: 'id')
 * @param ownerField Tên field trong entity chứa owner_id (default: 'owner_id')
 * @param resourceName Tên resource (để thông báo lỗi)
 * @example @Owner('userId', 'owner_id', 'user') - Kiểm tra user có phải owner không
 */
export const Owner = (
  resourceIdParam: string = 'id',
  ownerField: string = 'owner_id',
  resourceName?: string,
) => SetMetadata(OWNER_KEY, { resourceIdParam, ownerField, resourceName });

