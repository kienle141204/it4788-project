import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '../../common/decorators/user.decorator';
import type { JwtUser } from '../../common/types/user.type';
enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  /** 👤 Public create user */
  @Post()
  async createUser(@Body() dto: CreateUserDto) {
    return await this.userService.createUser(dto);
  }

  /** 📄 Admin: get all users */
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllUsers(@User() user: JwtUser) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can view all users');
    }
    return this.userService.getAllUsers();
  }

  /** 👀 Get user by ID */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUser(@Param('id', ParseIntPipe) id: number, @User() user: JwtUser) {
    if (user.role !== UserRole.ADMIN && user.id !== id) {
      throw new ForbiddenException('You can only view your own account');
    }
    return this.userService.getUserById(id);
  }

  /** ✏️ Update user */
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @User() user: JwtUser,
  ) {
    if (user.role !== UserRole.ADMIN && user.id !== id) {
      throw new ForbiddenException('You can only update your own account');
    }
    return await this.userService.updateUser(id, dto);
  }

  /** ❌ Delete user */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @User() user: JwtUser,
  ) {
    if (user.role !== UserRole.ADMIN && user.id !== id) {
      throw new ForbiddenException('You can only delete your own account');
    }

    await this.userService.deleteUser(id);
    return { message: `User ${id} deleted successfully` };
  }
}
