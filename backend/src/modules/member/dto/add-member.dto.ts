import { IsNumber, IsOptional, IsEnum } from 'class-validator';

export class AddMemberDto {
  @IsNumber()
  family_id: number;

  @IsNumber()
  user_id: number;

  @IsOptional()
  @IsEnum(['member', 'manager'], { message: 'Role must be member or manager' })
  role?: 'member' | 'manager' = 'member';
}
