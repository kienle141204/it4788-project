import { IsString, MinLength } from 'class-validator';

export class JoinByCodeDto {
  @IsString()
  @MinLength(8, { message: 'Mã mời phải có ít nhất 8 ký tự' })
  invitation_code: string;
}

