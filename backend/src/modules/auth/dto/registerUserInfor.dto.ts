import { IsString, MinLength, IsOptional, IsUrl } from 'class-validator';

export class RegisterUserInfoDto {
  @IsString({ message: 'Họ tên phải là chuỗi' })
  @MinLength(2, { message: 'Họ tên phải có ít nhất 2 ký tự' })
  fullname: string;

  @IsOptional()
  @IsUrl({}, { message: 'URL avatar không hợp lệ' })
  avatar_url?: string;

  @IsOptional()
  @IsString({ message: 'Địa chỉ phải là chuỗi' })
  address?: string;
}
