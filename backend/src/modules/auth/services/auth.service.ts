import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../../entities/user.entity';
import { TempUser } from '../../../entities/temp-user.entity';
import { Family } from '../../../entities/family.entity';
import { FamilyMember } from '../../../entities/family-member.entity';
import { RegisterTempDto } from '../dto/register-temp.dto';
import { LoginDto } from '../dto/login.dto';
import { VerifyOtpDto } from '../dto/verify-otp.dto';
import { ResendOtpDto } from '../dto/resend-otp.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { CreateFamilyDto } from '../dto/create-family.dto';
import { JoinFamilyDto } from '../dto/join-family.dto';
import { RegisterUserInfoDto } from '../dto/registerUserInfor.dto';
import { EmailService } from './email.service';

@Injectable()
export class AuthService {
  
  /**
   * Chuyển đổi thời gian hiện tại thành Vietnam timezone
   */
  private getVietnamTime(): Date {
    const now = new Date();
    // Vietnam timezone là UTC+7
    const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    return vietnamTime;
  }
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(TempUser)
    private tempUserRepository: Repository<TempUser>,
    @InjectRepository(Family)
    private familyRepository: Repository<Family>,
    @InjectRepository(FamilyMember)
    private familyMemberRepository: Repository<FamilyMember>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  /**
   * Đăng ký tạm thời và gửi OTP
   */
  async registerTemp(registerTempDto: RegisterTempDto): Promise<{ message: string }> {
    const { email, phone_number, password } = registerTempDto;

    // Kiểm tra email đã tồn tại trong bảng users chưa
    const existingUserByEmail = await this.userRepository.findOne({ where: { email } });
    if (existingUserByEmail) {
      throw new ConflictException('Email này đã được sử dụng');
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 12);

    // Tạo mã OTP 6 số
    const otpCode = this.generateOtp();

    // Xóa temp_user cũ nếu có (để có thể đăng ký lại)
    await this.tempUserRepository.delete({ email });

    // Tạo temp_user mới với Vietnam time
    const vietnamTime = this.getVietnamTime();
    const tempUser = this.tempUserRepository.create({
      email,
      phone_number,
      password_hash: hashedPassword,
      otp_code: otpCode,
      status: 'PENDING',
      tp_sent_at: vietnamTime, // Sử dụng Vietnam time
    });

    const savedTempUser = await this.tempUserRepository.save(tempUser);
    
    console.log('OTP Created:', {
      email: savedTempUser.email,
      otpCode: savedTempUser.otp_code,
      tpSentAt: savedTempUser.tp_sent_at,
      tpSentAtLocal: new Date(savedTempUser.tp_sent_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      status: savedTempUser.status
    });

    // Gửi email OTP
    await this.emailService.sendOtpEmail(email, otpCode);

    return {
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP xác minh.',
    };
  }

  /**
   * Xác minh OTP và tạo user thật
   */
  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{ message: string; access_token: string; refresh_token: string; user: Partial<User> }> {
    const { email, otp_code } = verifyOtpDto;

    // Tìm temp_user
    const tempUser = await this.tempUserRepository.findOne({ 
      where: { email, status: 'PENDING' } 
    });

    if (!tempUser) {
      throw new BadRequestException('Không tìm thấy yêu cầu đăng ký hoặc đã được xử lý');
    }

    // Kiểm tra OTP có đúng không
    if (tempUser.otp_code !== otp_code) {
      throw new BadRequestException('Mã OTP không đúng');
    }

    // Kiểm tra OTP có hết hạn không (3 phút)
    const currentTime = new Date(); // Sử dụng thời gian hiện tại
    const otpSentTime = new Date(tempUser.tp_sent_at);
    const otpExpiryTime = new Date(otpSentTime.getTime() + 3 * 60 * 1000);
    
    console.log('OTP Debug Info:', {
      currentTime: currentTime.toISOString(),
      currentTimeLocal: currentTime.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      otpSentTime: otpSentTime.toISOString(),
      otpSentTimeLocal: otpSentTime.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      otpExpiryTime: otpExpiryTime.toISOString(),
      otpExpiryTimeLocal: otpExpiryTime.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      timeDiff: (currentTime.getTime() - otpSentTime.getTime()) / 1000 / 60, // phút
      isExpired: currentTime > otpExpiryTime
    });
    
    if (currentTime > otpExpiryTime) {
      // Đánh dấu OTP hết hạn
      await this.tempUserRepository.update(tempUser.temp_user_id, { status: 'EXPIRED' });
      throw new BadRequestException('Mã OTP đã hết hạn. Vui lòng gửi lại mã mới');
    }

    // Tạo user thật
    const user = new User();
    user.email = tempUser.email;
    user.phone = tempUser.phone_number || '';
    user.password_hash = tempUser.password_hash;
    user.role = 'user';
    // Các trường nullable khác sẽ được tự động set thành null

    const savedUser = await this.userRepository.save(user);

    // Đánh dấu temp_user đã được xác minh
    await this.tempUserRepository.update(tempUser.temp_user_id, { status: 'VERIFIED' });

    // Tạo access token (hết hạn sau 15 phút)
    const accessPayload = { sub: savedUser.id, email: savedUser.email, type: 'access' };
    const access_token = this.jwtService.sign(accessPayload, { expiresIn: '15m' });

    // Tạo refresh token (hết hạn sau 7 ngày)
    const refreshPayload = { sub: savedUser.id, email: savedUser.email, type: 'refresh' };
    const refresh_token = this.jwtService.sign(refreshPayload, { expiresIn: '7d' });

    // Lưu refresh token vào database
    await this.userRepository.update(savedUser.id, { refresh_token });

    // Trả về thông tin người dùng (không bao gồm mật khẩu)
    const { password_hash, ...userWithoutPassword } = savedUser;

    return {
      message: 'Xác minh thành công! Chào mừng bạn đến với hệ thống.',
      access_token,
      refresh_token,
      user: userWithoutPassword,
    };
  }

  /**
   * Gửi lại OTP
   */
  async resendOtp(resendOtpDto: ResendOtpDto): Promise<{ message: string }> {
    const { email } = resendOtpDto;

    // Tìm temp_user
    const tempUser = await this.tempUserRepository.findOne({ 
      where: { email, status: 'PENDING' } 
    });

    if (!tempUser) {
      throw new BadRequestException('Không tìm thấy yêu cầu đăng ký');
    }

    // Tạo mã OTP mới
    const newOtpCode = this.generateOtp();

    // Cập nhật OTP mới với Vietnam time
    const newSentTime = this.getVietnamTime();
    await this.tempUserRepository.update(tempUser.temp_user_id, {
      otp_code: newOtpCode,
      tp_sent_at: newSentTime,
    });

    console.log('OTP Resent:', {
      email: email,
      newOtpCode: newOtpCode,
      newSentTime: newSentTime.toISOString(),
      newSentTimeLocal: newSentTime.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      expiryTime: new Date(newSentTime.getTime() + 3 * 60 * 1000).toISOString(),
      expiryTimeLocal: new Date(newSentTime.getTime() + 3 * 60 * 1000).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
    });

    // Gửi email OTP mới
    await this.emailService.sendOtpEmail(email, newOtpCode);

    return {
      message: 'Đã gửi lại mã OTP. Vui lòng kiểm tra email.',
    };
  }

  /**
   * Đăng ký thêm thông tin người dùng
   */
  async registerUserInfo(registerUserInfoDto: RegisterUserInfoDto, userId: number): Promise<{ 
    message: string; 
    user: Partial<User> 
  }> {
    const { fullname, avatar_url, address } = registerUserInfoDto;

    // Tìm user hiện tại
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // Cập nhật thông tin người dùng
    await this.userRepository.update(userId, {
      full_name: fullname,
      avatar_url,
      address,
    });

    // Lấy thông tin user đã cập nhật
    const updatedUser = await this.userRepository.findOne({ where: { id: userId } });
    if (!updatedUser) {
      throw new NotFoundException('Không tìm thấy người dùng sau khi cập nhật');
    }
    const { password_hash, refresh_token, ...userWithoutSensitiveData } = updatedUser;

    return {
      message: 'Cập nhật thông tin người dùng thành công',
      user: userWithoutSensitiveData,
    };
  }

  /**
   * Đăng nhập người dùng
   */
  async login(loginDto: LoginDto): Promise<{ 
    access_token: string; 
    refresh_token: string; 
    user: Partial<User> 
  }> {
    const { email, password } = loginDto;

    if (!email) {
      throw new BadRequestException('Vui lòng cung cấp email');
    }

    // Tìm người dùng theo email
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Tạo access token (hết hạn sau 15 phút)
    const accessPayload = { sub: user.id, email: user.email, type: 'access' };
    const access_token = this.jwtService.sign(accessPayload, { expiresIn: '15m' });

    // Tạo refresh token (hết hạn sau 7 ngày)
    const refreshPayload = { sub: user.id, email: user.email, type: 'refresh' };
    const refresh_token = this.jwtService.sign(refreshPayload, { expiresIn: '7d' });

    // Lưu refresh token vào database
    await this.userRepository.update(user.id, { refresh_token });

    // Trả về thông tin người dùng (không bao gồm mật khẩu)
    const { password_hash, ...userWithoutPassword } = user;

    return {
      access_token,
      refresh_token,
      user: userWithoutPassword,
    };
  }

  /**
   * Tạo gia đình mới
   */
  async createFamily(createFamilyDto: CreateFamilyDto, userId: number): Promise<{ message: string; family: Family }> {
    const { name } = createFamilyDto;

    // Tạo gia đình mới
    const family = this.familyRepository.create({
      name,
      owner_id: userId,
    });

    const savedFamily = await this.familyRepository.save(family);

    // Tự động thêm owner làm member với role manager
    const familyMember = this.familyMemberRepository.create({
      family_id: savedFamily.id,
      user_id: userId,
      role: 'manager',
    });

    await this.familyMemberRepository.save(familyMember);

    return {
      message: 'Tạo gia đình thành công',
      family: savedFamily,
    };
  }

  /**
   * Tham gia gia đình
   */
  async joinFamily(joinFamilyDto: JoinFamilyDto, userId: number): Promise<{ message: string }> {
    const { family_id } = joinFamilyDto;

    // Kiểm tra gia đình có tồn tại không
    const family = await this.familyRepository.findOne({ where: { id: family_id } });
    if (!family) {
      throw new NotFoundException('Không tìm thấy gia đình');
    }

    // Kiểm tra user đã là member chưa
    const existingMember = await this.familyMemberRepository.findOne({
      where: { family_id, user_id: userId },
    });

    if (existingMember) {
      throw new ConflictException('Bạn đã là thành viên của gia đình này');
    }

    // Thêm user vào gia đình với role member
    const familyMember = this.familyMemberRepository.create({
      family_id,
      user_id: userId,
      role: 'member',
    });

    await this.familyMemberRepository.save(familyMember);

    return {
      message: 'Tham gia gia đình thành công',
    };
  }

  /**
   * Lấy danh sách gia đình của user
   */
  async getUserFamilies(userId: number): Promise<Family[]> {
    const families = await this.familyRepository
      .createQueryBuilder('family')
      .leftJoinAndSelect('family.members', 'member')
      .leftJoinAndSelect('member.user', 'user')
      .where('family.owner_id = :userId', { userId })
      .orWhere('member.user_id = :userId', { userId })
      .getMany();

    return families;
  }

  /**
   * Lấy thông tin gia đình theo ID
   */
  async getFamilyById(familyId: number, userId: number): Promise<Family> {
    const family = await this.familyRepository
      .createQueryBuilder('family')
      .leftJoinAndSelect('family.members', 'member')
      .leftJoinAndSelect('member.user', 'user')
      .leftJoinAndSelect('family.owner', 'owner')
      .where('family.id = :familyId', { familyId })
      .andWhere(
        '(family.owner_id = :userId OR member.user_id = :userId)',
        { userId }
      )
      .getOne();

    if (!family) {
      throw new NotFoundException('Không tìm thấy gia đình hoặc bạn không có quyền truy cập');
    }

    return family;
  }

  /**
   * Lấy thông tin người dùng từ JWT
   */
  async validateUser(payload: any): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('Người dùng không hợp lệ');
    }

    return user;
  }


  /**
   * Làm mới access token
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<{ 
    access_token: string; 
    refresh_token: string; 
  }> {
    const { refresh_token } = refreshTokenDto;

    try {
      // Xác minh refresh token
      const payload = this.jwtService.verify(refresh_token);
      
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Token không hợp lệ');
      }

      // Tìm user
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Refresh token không hợp lệ');
      }

      // Tạo access token mới
      const accessPayload = { sub: user.id, email: user.email, type: 'access' };
      const newAccessToken = this.jwtService.sign(accessPayload, { expiresIn: '15m' });

      // Tạo refresh token mới
      const refreshPayload = { sub: user.id, email: user.email, type: 'refresh' };
      const newRefreshToken = this.jwtService.sign(refreshPayload, { expiresIn: '7d' });

      // Cập nhật refresh token trong database
      await this.userRepository.update(user.id, { refresh_token: newRefreshToken });

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }
  }

  /**
   * Đăng xuất - xóa refresh token
   */
  async logout(userId: number): Promise<{ message: string }> {
    await this.userRepository.update(userId, { refresh_token: null as any });
    return { message: 'Đăng xuất thành công' };
  }

  /**
   * Tạo mã OTP 6 số
   */
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
