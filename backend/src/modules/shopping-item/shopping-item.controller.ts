import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ShoppingItemService } from './shopping-item.service';
import { CreateShoppingItemDto } from './dto/create-shopping-item.dto';
import { UpdateShoppingItemDto } from './dto/update-shopping-item.dto';
import { ShoppingItem } from '../../entities/shopping-item.entity';
import { User, Roles, Owner, JwtAuthGuard, RolesGuard, OwnerGuard, SelfOrAdminGuard } from 'src/common';
import type { JwtUser } from 'src/common/types/user.type';

@ApiTags('Shopping Items')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('api/shopping-items')
export class ShoppingItemController {
  constructor(private readonly shoppingItemService: ShoppingItemService) { }

  @Post()
  @ApiOperation({ summary: 'Tạo item mới trong danh sách mua sắm' })
  @ApiResponse({ status: 201, type: ShoppingItem })
  async create(@Body() dto: CreateShoppingItemDto, @User() user: JwtUser) {
    return await this.shoppingItemService.create(dto, user);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Lấy tất cả item' })
  async findAll() {
    return await this.shoppingItemService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết 1 item' })
  async findOne(@Param('id') id: string, @User() user: JwtUser) {
    return await this.shoppingItemService.findOne(+id, user);
  }

  @Patch('check/:id')
  @ApiOperation({ summary: 'Tick đã mua item' })
  async check(@Param('id') id: string, @User() user: JwtUser) {
    return await this.shoppingItemService.check(+id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật item' })
  async update(@Param('id') id: string, @Body() dto: UpdateShoppingItemDto, @User() user: JwtUser) {
    return await this.shoppingItemService.update(+id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa item' })
  async remove(@Param('id') id: string, @User() user: JwtUser) {
    return await this.shoppingItemService.remove(+id, user);
  }
}
