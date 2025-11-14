import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ShoppingListService } from './shopping-list.service';
import { CreateShoppingListDto } from './dto/create-shopping-list.dto';
import { UpdateShoppingListDto } from './dto/update-shopping-list.dto';
import { User, Roles, Owner, JwtAuthGuard, RolesGuard, OwnerGuard, SelfOrAdminGuard } from 'src/common';
import type { JwtUser } from 'src/common/types/user.type';

@ApiTags('Shopping Lists')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('api/shopping-lists')
export class ShoppingListController {
  constructor(private readonly shoppingListService: ShoppingListService) { }

  /** POST /shopping-lists */
  @Post()
  @ApiOperation({ summary: 'Tạo danh sách mua sắm (tự tạo hoặc tạo cho thành viên khác trong gia đình nếu là owner)' })
  async create(@Body() dto: CreateShoppingListDto, @User() user: JwtUser) {
    return await this.shoppingListService.create(dto, user);
  }

  /** GET /shopping-lists */
  @Get()
  @ApiOperation({ summary: 'Lấy ra toàn bộ danh sách mua sắm (admin)' })
  @UseGuards(RolesGuard)
  @Roles('admin')
  async findAll() {
    return await this.shoppingListService.findAll();
  }

  /** GET /shopping-lists/my-list */
  @Get('my-list')
  @ApiOperation({ summary: 'Lấy ra toàn bộ danh sách mua sắm mình làm chủ' })
  async myShoppingList(@User() user: JwtUser) {
    return await this.shoppingListService.myShoppingList(user);
  }

  /** GET /shopping-lists/:id */
  @Get(':id')
  @ApiOperation({ summary: 'Lấy ra danh sách mua sắm theo id' })
  async findOne(@Param('id', ParseIntPipe) id: number, @User() user: JwtUser) {
    return await this.shoppingListService.findOne(id, user);
  }

  // Lấy ra danh sách các list mua sắm được share trong gia đình
  @Get('my-family-shared/:id')
  @ApiOperation({ summary: 'Lấy ra toàn bộ danh sách mua sắm được share trong gia đình' })
  async myFamilyShared(@Param('id', ParseIntPipe) id: number, @User() user: JwtUser) {
    return await this.shoppingListService.myFamilyShared(id, user);
  }

  /** PATCH /shopping-lists/:id */
  @Patch('share/:id')
  @ApiOperation({ summary: 'Share danh sách với gia đình' })
  async shareShoppingList(@Param('id', ParseIntPipe) id: number, @User() user: JwtUser) {
    return await this.shoppingListService.shareShoppingList(id, user);
  }

  /** PATCH /shopping-lists/:id */
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật danh sách mua sắm' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateShoppingListDto, @User() user: JwtUser) {
    return await this.shoppingListService.update(id, dto, user);
  }

  /** DELETE /shopping-lists/:id */
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa danh sách mua sắm' })
  async remove(@Param('id', ParseIntPipe) id: number, @User() user: JwtUser) {
    return await this.shoppingListService.remove(id, user);
  }
}
