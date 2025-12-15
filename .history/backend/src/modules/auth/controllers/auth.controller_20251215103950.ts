import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { RegisterTempDto } from '../dto/register-temp.dto';
import { LoginDto } from '../dto/login.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { ResendOtpDto } from '../dto/resend-otp.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { RegisterUserInfoDto } from '../dto/registerUserInfor.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ResponseCode, buildSuccessResponse } from 'src/common';

@ApiTags('Authentication')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  /**
   * API đăng ký tạm thời và gửi OTP
   */
  @Post('register-temp')
  @ApiOperation({ 
    summary: 'Đăng ký tạm thời và gửi OTP',
    description: 'API này cho phép người dùng đăng ký tạm thời bằng email và nhận mã OTP qua email để xác minh tài khoản. Mã OTP có hiệu lực trong 3 phút.'
  })
  @ApiBody({
    type: RegisterTempDto,
    examples: {
      example1: {
        summary: 'Đăng ký với email và password',
        value: {
          email: 'vuongthanhsaovang@gmail.com',
          password: '123456',
          phone_number: '0123456789'
        }
      },
      example2: {
        summary: 'Đăng ký không có số điện thoại',
        value: {
          email: 'user@example.com',
          password: 'password123'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Đăng ký thành công, OTP đã được gửi đến email',
    example: {
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP xác minh.'
    }
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ (email không đúng định dạng, password quá ngắn, v.v.)' })
  @ApiResponse({ status: 409, description: 'Email đã tồn tại trong hệ thống' })
  async registerTemp(@Body(ValidationPipe) registerTempDto: RegisterTempDto) {
    return await this.authService.registerTemp(registerTempDto);
  }

  /**
   * API xác minh OTP và tạo user thật
   */
  @Post('verify-otp')
  @ApiOperation({ 
    summary: 'Xác minh OTP và tạo tài khoản',
    description: 'API này xác minh mã OTP được gửi đến email và tạo tài khoản người dùng chính thức. Trả về access token và refresh token để sử dụng cho các API tiếp theo.'
  })
  @ApiBody({
    type: VerifyOtpDto,
    examples: {
      example1: {
        summary: 'Xác minh OTP',
        value: {
          email: 'vuongthanhsaovang@gmail.com',
          otp_code: '123456'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Xác minh thành công, tài khoản đã được tạo',
    example: {
      message: 'Xác minh thành công! Chào mừng bạn đến với hệ thống.',
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidnVvbmd0aGFuaHNhb3ZhbmdAZ21haWwuY29tIiwidHlwZSI6ImFjY2VzcyIsImlhdCI6MTcwNDA2NDAwMCwiZXhwIjoxNzA0MzIzMjAwfQ.example',
      refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidnVvbmd0aGFuaHNhb3ZhbmdAZ21haWwuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3MDQwNjQwMDAsImV4cCI6MTcwNDY2ODgwMH0.example',
      user: {
        id: 1,
        email: 'vuongthanhsaovang@gmail.com',
        role: 'user'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'OTP không đúng hoặc đã hết hạn (quá 3 phút)' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy yêu cầu đăng ký tạm thời' })
  async verifyOtp(@Body(ValidationPipe) verifyOtpDto: VerifyOtpDto) {
    return await this.authService.verifyOtp(verifyOtpDto);
  }

  /**
   * API gửi lại OTP
   */
  @Post('resend-otp')
  @ApiOperation({ 
    summary: 'Gửi lại mã OTP',
    description: 'API này cho phép người dùng yêu cầu gửi lại mã OTP nếu chưa nhận được hoặc mã đã hết hạn. Mã OTP mới sẽ được gửi đến email và có hiệu lực trong 3 phút.'
  })
  @ApiBody({
    type: ResendOtpDto,
    examples: {
      example1: {
        summary: 'Yêu cầu gửi lại OTP',
        value: {
          email: 'vuongthanhsaovang@gmail.com'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'OTP đã được gửi lại thành công',
    example: {
      message: 'Đã gửi lại mã OTP. Vui lòng kiểm tra email.'
    }
  })
  @ApiResponse({ status: 400, description: 'Email không hợp lệ hoặc không tìm thấy yêu cầu đăng ký' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy yêu cầu đăng ký tạm thời với email này' })
  async resendOtp(@Body(ValidationPipe) resendOtpDto: ResendOtpDto) {
    console.log('ResendOtpDto received:', resendOtpDto);
    return await this.authService.resendOtp(resendOtpDto);
  }

  /** 
   * API đăng kí thêm thông tin người dùng
   */
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('register-user-info')
  @ApiOperation({ 
    summary: 'Cập nhật thông tin người dùng',
    description: 'API này cho phép người dùng cập nhật thông tin cá nhân như họ tên, avatar và địa chỉ sau khi đã đăng ký tài khoản. Yêu cầu đăng nhập.'
  })
  @ApiBody({
    type: RegisterUserInfoDto,
    examples: {
      example1: {
        summary: 'Cập nhật thông tin đầy đủ',
        value: {
          fullname: 'Nguyễn Văn A',
          avatar_url: 'https://example.com/avatar.jpg',
          address: '123 Đường ABC, Quận 1, TP.HCM'
        }
      },
      example2: {
        summary: 'Chỉ cập nhật họ tên',
        value: {
          fullname: 'Nguyễn Văn A'
        }
      },
      example3: {
        summary: 'Cập nhật avatar và địa chỉ',
        value: {
          avatar_url: 'https://example.com/new-avatar.jpg',
          address: '456 Đường XYZ, Quận 2, TP.HCM'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cập nhật thông tin thành công',
    example: {
      message: 'Cập nhật thông tin người dùng thành công',
      user: {
        id: 1,
        email: 'vuongthanhsaovang@gmail.com',
        fullname: 'Nguyễn Văn A',
        avatar_url: 'https://example.com/avatar.jpg',
        address: '123 Đường ABC, Quận 1, TP.HCM',
        role: 'user'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập hoặc token không hợp lệ' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ (họ tên quá ngắn, URL avatar không đúng định dạng, v.v.)' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  async registerUserInfo(@Body(ValidationPipe) registerUserInfoDto: RegisterUserInfoDto, @Request() req) {
    return await this.authService.registerUserInfo(registerUserInfoDto, req.user.id);
  }
  /**
   * API đăng nhập
   */
  @Post('login')
  @ApiOperation({ 
    summary: 'Đăng nhập',
    description: 'API này cho phép người dùng đăng nhập bằng email và password. Trả về access token (hết hạn sau 7 ngày) và refresh token (hết hạn sau 7 ngày) để sử dụng cho các API tiếp theo.'
  })
  @ApiBody({
    type: LoginDto,
    examples: {
      example1: {
        summary: 'Đăng nhập',
        value: {
          email: 'vuongthanhsaovang@gmail.com',
          password: '123456'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Đăng nhập thành công',
    example: {
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidnVvbmd0aGFuaHNhb3ZhbmdAZ21haWwuY29tIiwidHlwZSI6ImFjY2VzcyIsImlhdCI6MTcwNDA2NDAwMCwiZXhwIjoxNzA0MDY0OTAwfQ.example',
      refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidnVvbmd0aGFuaHNhb3ZhbmdAZ21haWwuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3MDQwNjQwMDAsImV4cCI6MTcwNDY2ODgwMH0.example',
      user: {
        id: 1,
        email: 'vuongthanhsaovang@gmail.com',
        fullname: 'Nguyễn Văn A',
        role: 'user'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ (thiếu email hoặc password)' })
  @ApiResponse({ status: 401, description: 'Email hoặc mật khẩu không đúng' })
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  /**
   * API lấy thông tin profile người dùng hiện tại
   */
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({ 
    summary: 'Lấy thông tin profile',
    description: 'API này trả về thông tin profile của người dùng hiện tại đang đăng nhập. Yêu cầu đăng nhập với access token hợp lệ.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lấy thông tin profile thành công',
    example: {
      id: 1,
      email: 'vuongthanhsaovang@gmail.com',
      fullname: 'Nguyễn Văn A',
      avatar_url: 'https://example.com/avatar.jpg',
      address: '123 Đường ABC, Quận 1, TP.HCM',
      phone: '0123456789',
      role: 'user',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    }
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập hoặc token không hợp lệ' })
  async getProfile(@Request() req) {
    const { password_hash, refresh_token, ...userWithoutPassword } = req.user;
    return userWithoutPassword;
  }

  /**
   * API làm mới access token
   */
  @Post('refresh-token')
  @ApiOperation({ 
    summary: 'Làm mới access token',
    description: 'API này cho phép người dùng làm mới access token bằng refresh token khi access token đã hết hạn. Access token mới và refresh token mới đều có hiệu lực trong 7 ngày.'
  })
  @ApiBody({
    type: RefreshTokenDto,
    examples: {
      example1: {
        summary: 'Làm mới token',
        value: {
          refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidnVvbmd0aGFuaHNhb3ZhbmdAZ21haWwuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3MDQwNjQwMDAsImV4cCI6MTcwNDY2ODgwMH0.example'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Làm mới token thành công',
    example: {
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidnVvbmd0aGFuaHNhb3ZhbmdAZ21haWwuY29tIiwidHlwZSI6ImFjY2VzcyIsImlhdCI6MTcwNDA2NDAwMCwiZXhwIjoxNzA0MDY0OTAwfQ.new',
      refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidnVvbmd0aGFuaHNhb3ZhbmdAZ21haWwuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3MDQwNjQwMDAsImV4cCI6MTcwNDY2ODgwMH0.new'
    }
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ (thiếu refresh_token)' })
  @ApiResponse({ status: 401, description: 'Refresh token không hợp lệ, đã hết hạn hoặc không tồn tại trong database' })
  async refreshToken(@Body(ValidationPipe) refreshTokenDto: RefreshTokenDto) {
    return await this.authService.refreshToken(refreshTokenDto);
  }

  /**
   * API đăng xuất
   */
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiOperation({ 
    summary: 'Đăng xuất',
    description: 'API này cho phép người dùng đăng xuất khỏi hệ thống. Refresh token sẽ bị vô hiệu hóa trong database, người dùng cần đăng nhập lại để lấy token mới.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Đăng xuất thành công',
    example: {
      message: 'Đăng xuất thành công'
    }
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập hoặc token không hợp lệ' })
  async logout(@Request() req) {
    return await this.authService.logout(req.user.id);
  }
}
