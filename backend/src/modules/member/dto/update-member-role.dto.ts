import { IsEnum } from 'class-validator';

export class UpdateMemberRoleDto {
  @IsEnum(['member', 'manager'], { message: 'Role must be member or manager' })
  role: 'member' | 'manager';
}
