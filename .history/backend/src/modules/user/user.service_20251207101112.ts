import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async createUser(dto: CreateUserDto): Promise<User> {
    const exists = await this.userRepository.findOne({
      where: [{ email: dto.email }, { phone: dto.phone }],
    });

    if (exists) {
      throw new BadRequestException('Email or phone already exists');
    }

    const user = this.userRepository.create(dto);
    return await this.userRepository.save(user);
  }

  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async getUserById(
    id: number,
    currentUserId?: number,
    currentUserRole?: string,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);

    // Admin có thể xem tất cả user
    if (currentUserRole === 'admin') {
      return user;
    }

    // User có thể xem chính mình
    if (currentUserId && currentUserId === id) {
      return user;
    }

    // Kiểm tra profile_status: nếu private thì không cho phép user khác xem
    if (user.profile_status === 'private') {
      throw new ForbiddenException('Tài khoản này đang ở trạng thái riêng tư');
    }

    // Nếu profile_status là public, cho phép xem
    return user;
  }

  async updateUser(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);

    // Kiểm tra email trùng (nếu có thay đổi email)
    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: dto.email },
      });
      if (existingUser && existingUser.id !== id) {
        throw new BadRequestException('Email đã được sử dụng bởi người dùng khác');
      }
    }

    // Kiểm tra phone trùng (nếu có thay đổi phone)
    if (dto.phone && dto.phone !== user.phone) {
      const existingUser = await this.userRepository.findOne({
        where: { phone: dto.phone },
      });
      if (existingUser && existingUser.id !== id) {
        throw new BadRequestException('Số điện thoại đã được sử dụng bởi người dùng khác');
      }
    }

    // Hash password nếu có thay đổi
    if (dto.password) {
      const salt = await bcrypt.genSalt(10);
      dto.password = await bcrypt.hash(dto.password, salt);
      // Đổi tên field từ password sang password_hash
      (dto as any).password_hash = dto.password;
      delete (dto as any).password;
    }

    // Cập nhật thông tin
    Object.assign(user, dto);
    return await this.userRepository.save(user);
  }

  async deleteUser(id: number): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`User ${id} not found`);
    }
  }
}
