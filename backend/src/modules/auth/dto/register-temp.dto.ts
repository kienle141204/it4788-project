import { IsEmail, IsString, MinLength, IsOptional, Matches } from 'class-validator';

export class RegisterTempDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  @Matches(/^[0-9+\-\s()]+$/, { message: 'Số điện thoại không hợp lệ' })
  phone_number?: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;
}


