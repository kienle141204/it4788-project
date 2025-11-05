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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  /** 👤 Public create user */
  @Post()
  async createUser(@Body() dto: CreateUserDto) {
    return await this.userService.createUser(dto);
  }

  /** 📄 Admin: get all users */
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  async getAllUsers(@User() user: JwtUser) {
    return this.userService.getAllUsers();
  }

  /** 👀 Get user by ID */
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, SelfOrAdminGuard('id'))
  @Get(':id')
  async getUser(@Param('id', ParseIntPipe) id: number, @User() user: JwtUser) {
    return this.userService.getUserById(id);
  }

  /** ✏️ Update user */
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, SelfOrAdminGuard('id'))
  @Put(':id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @User() user: JwtUser,
  ) {
    return await this.userService.updateUser(id, dto);
  }

  /** ❌ Delete user */
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, SelfOrAdminGuard('id'))
  @Delete(':id')
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @User() user: JwtUser,
  ) {
    await this.userService.deleteUser(id);
    return { message: `User ${id} deleted successfully` };
  }
}
