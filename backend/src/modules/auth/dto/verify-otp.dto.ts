import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString({ message: 'Mã OTP phải là chuỗi' })
  @Length(6, 6, { message: 'Mã OTP phải có đúng 6 ký tự' })
  otp_code: string;
}


