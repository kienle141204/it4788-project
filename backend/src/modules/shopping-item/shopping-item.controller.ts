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

@ApiTags('Shopping Items')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('api/shopping-items')
export class ShoppingItemController {
  constructor(private readonly shoppingItemService: ShoppingItemService) { }

  @Post()
  @ApiOperation({ summary: 'Tạo item mới trong danh sách mua sắm' })
  @ApiResponse({ status: 201, type: ShoppingItem })
  create(@Body() dto: CreateShoppingItemDto) {
    return this.shoppingItemService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả item' })
  findAll() {
    return this.shoppingItemService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết 1 item' })
  findOne(@Param('id') id: string) {
    return this.shoppingItemService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật item' })
  update(@Param('id') id: string, @Body() dto: UpdateShoppingItemDto) {
    return this.shoppingItemService.update(+id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa item' })
  remove(@Param('id') id: string) {
    return this.shoppingItemService.remove(+id);
  }
}
