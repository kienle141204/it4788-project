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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SelfOrAdminGuard } from '../auth/guards/self-or-admin.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '../../common/decorators/user.decorator';
import type { JwtUser } from '../../common/types/user.type';

@ApiTags('Users')
@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  /** Public create user */
  @Post()
  @ApiOperation({ 
    summary: 'Tạo người dùng mới',
    description: 'API công khai cho phép tạo một người dùng mới trong hệ thống. Lưu ý: API này có thể không được sử dụng nếu hệ thống chỉ cho phép đăng ký qua OTP.'
  })
  @ApiBody({
    type: CreateUserDto,
    examples: {
      example1: {
        summary: 'Tạo người dùng',
        value: {
          email: 'user@example.com',
          password: 'password123',
          fullname: 'Nguyễn Văn A'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Tạo người dùng thành công',
    example: {
      id: 1,
      email: 'user@example.com',
      fullname: 'Nguyễn Văn A',
      role: 'user',
      created_at: '2024-01-01T00:00:00.000Z'
    }
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 409, description: 'Email đã tồn tại' })
  async createUser(@Body() dto: CreateUserDto) {
    return await this.userService.createUser(dto);
  }

  /** Admin: get all users */
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  @ApiOperation({ 
    summary: 'Lấy tất cả người dùng',
    description: 'API này trả về danh sách tất cả các người dùng trong hệ thống. Yêu cầu quyền admin.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lấy danh sách người dùng thành công',
    example: [
      {
        id: 1,
        email: 'user@example.com',
        fullname: 'Nguyễn Văn A',
        role: 'user'
      }
    ]
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền admin' })
  async getAllUsers(@User() user: JwtUser) {
    return this.userService.getAllUsers();
  }

  /** Get user by ID */
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, SelfOrAdminGuard('id'))
  @Get(':id')
  @ApiOperation({ 
    summary: 'Lấy thông tin người dùng theo ID',
    description: 'API này trả về thông tin chi tiết của một người dùng theo ID. Người dùng chỉ có thể xem thông tin của chính mình hoặc admin có thể xem tất cả.'
  })
  @ApiParam({ name: 'id', type: 'number', example: 1, description: 'ID của người dùng' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lấy thông tin người dùng thành công',
    example: {
      id: 1,
      email: 'user@example.com',
      fullname: 'Nguyễn Văn A',
      avatar_url: 'https://example.com/avatar.jpg',
      address: '123 Đường ABC, Quận 1, TP.HCM',
      role: 'user',
      created_at: '2024-01-01T00:00:00.000Z'
    }
  })
  @ApiResponse({ status: 403, description: 'Không có quyền xem thông tin người dùng này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  async getUser(@Param('id', ParseIntPipe) id: number, @User() user: JwtUser) {
    return this.userService.getUserById(id);
  }

  /** Update user */
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, SelfOrAdminGuard('id'))
  @Put(':id')
  @ApiOperation({ 
    summary: 'Cập nhật thông tin người dùng',
    description: 'API này cho phép người dùng cập nhật thông tin của chính mình hoặc admin có thể cập nhật thông tin của bất kỳ người dùng nào.'
  })
  @ApiParam({ name: 'id', type: 'number', example: 1, description: 'ID của người dùng' })
  @ApiBody({
    type: UpdateUserDto,
    examples: {
      example1: {
        summary: 'Cập nhật thông tin đầy đủ',
        value: {
          fullname: 'Nguyễn Văn B',
          avatar_url: 'https://example.com/new-avatar.jpg',
          address: '456 Đường XYZ, Quận 2, TP.HCM'
        }
      },
      example2: {
        summary: 'Chỉ cập nhật tên',
        value: {
          fullname: 'Nguyễn Văn B'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cập nhật thông tin thành công',
    example: {
      id: 1,
      email: 'user@example.com',
      fullname: 'Nguyễn Văn B',
      avatar_url: 'https://example.com/new-avatar.jpg',
      address: '456 Đường XYZ, Quận 2, TP.HCM',
      updated_at: '2024-01-01T00:00:00.000Z'
    }
  })
  @ApiResponse({ status: 403, description: 'Không có quyền cập nhật người dùng này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @User() user: JwtUser,
  ) {
    return await this.userService.updateUser(id, dto);
  }

  /** Delete user */
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, SelfOrAdminGuard('id'))
  @Delete(':id')
  @ApiOperation({ 
    summary: 'Xóa người dùng',
    description: 'API này cho phép người dùng xóa tài khoản của chính mình hoặc admin có thể xóa bất kỳ tài khoản nào. Lưu ý: Hành động này không thể hoàn tác.'
  })
  @ApiParam({ name: 'id', type: 'number', example: 1, description: 'ID của người dùng' })
  @ApiResponse({ 
    status: 200, 
    description: 'Xóa người dùng thành công',
    example: {
      message: 'User 1 deleted successfully'
    }
  })
  @ApiResponse({ status: 403, description: 'Không có quyền xóa người dùng này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @User() user: JwtUser,
  ) {
    await this.userService.deleteUser(id);
    return { message: `User ${id} deleted successfully` };
  }
}
