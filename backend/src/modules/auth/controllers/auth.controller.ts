import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { RegisterTempDto } from '../dto/register-temp.dto';
import { LoginDto } from '../dto/login.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { ResendOtpDto } from '../dto/resend-otp.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { RegisterUserInfoDto } from '../dto/registerUserInfor.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  /**
   * API đăng ký tạm thời và gửi OTP
   */
  @Post('register-temp')
  async registerTemp(@Body(ValidationPipe) registerTempDto: RegisterTempDto) {
    return await this.authService.registerTemp(registerTempDto);
  }

  /**
   * API xác minh OTP và tạo user thật
   */
  @Post('verify-otp')
  async verifyOtp(@Body(ValidationPipe) verifyOtpDto: VerifyOtpDto) {
    return await this.authService.verifyOtp(verifyOtpDto);
  }

  /**
   * API gửi lại OTP
   */
  @Post('resend-otp')
  async resendOtp(@Body(ValidationPipe) resendOtpDto: ResendOtpDto) {
    console.log('ResendOtpDto received:', resendOtpDto);
    return await this.authService.resendOtp(resendOtpDto);
  }

  /** 
   * API đăng kí thêm thông tin người dùng
   */
  @UseGuards(JwtAuthGuard)
  @Post('register-user-info')
  async registerUserInfo(@Body(ValidationPipe) registerUserInfoDto: RegisterUserInfoDto, @Request() req) {
    return await this.authService.registerUserInfo(registerUserInfoDto, req.user.id);
  }
  /**
   * API đăng nhập
   */
  @Post('login')
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  /**
   * API lấy thông tin profile người dùng hiện tại
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    const { password_hash, refresh_token, ...userWithoutPassword } = req.user;
    return userWithoutPassword;
  }

  /**
   * API làm mới access token
   */
  @Post('refresh-token')
  async refreshToken(@Body(ValidationPipe) refreshTokenDto: RefreshTokenDto) {
    return await this.authService.refreshToken(refreshTokenDto);
  }

  /**
   * API đăng xuất
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req) {
    return await this.authService.logout(req.user.id);
  }
}
