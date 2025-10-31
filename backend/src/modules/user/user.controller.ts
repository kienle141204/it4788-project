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
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(@Body() dto: CreateUserDto) {
    return await this.userService.createUser(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllUsers() {
    return await this.userService.getAllUsers();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUser(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const user = req.user;

    if (user.role !== 'admin' && user.id !== id) {
      throw new ForbiddenException('You can only view your own account');
    }

    return await this.userService.getUserById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @Req() req,
  ) {
    const user = req.user;

    if (user.role !== 'admin' && user.id !== id) {
      throw new ForbiddenException('You can only update your own account');
    }

    return await this.userService.updateUser(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteUser(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const user = req.user;

    if (user.role !== 'admin' && user.id !== id) {
      throw new ForbiddenException('You can only delete your own account');
    }

    await this.userService.deleteUser(id);
    return { message: `User with ID ${id} deleted successfully` };
  }
}
