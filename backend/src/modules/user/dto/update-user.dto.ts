import { IsOptional, IsString, MinLength, IsEnum, IsEmail } from 'class-validator';

export class  UpdateUserDto {
  @IsString()
  @MinLength(2)
  @IsOptional()
  full_name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsString()
  @MinLength(10)
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  avatar_url?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsEnum(['user', 'admin'])
  @IsOptional()
  role?: 'user' | 'admin';

  @IsEnum(['public', 'private'])
  @IsOptional()
  profile_status?: 'public' | 'private';
}
