import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtUser } from '../types/user.type';

export const User = createParamDecorator(
  (data: keyof JwtUser | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user as JwtUser;

    return data ? user[data] : user;
  },
);
