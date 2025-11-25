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
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { ShoppingListService } from './shopping-list.service';
import { CreateShoppingListDto } from './dto/create-shopping-list.dto';
import { UpdateShoppingListDto } from './dto/update-shopping-list.dto';
import { User, Roles, Owner, JwtAuthGuard, RolesGuard, OwnerGuard, SelfOrAdminGuard } from 'src/common';
import type { JwtUser } from 'src/common/types/user.type';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Shopping Lists')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('api/shopping-lists')
export class ShoppingListController {
  constructor(private readonly shoppingListService: ShoppingListService) { }

  /** POST /shopping-lists */
  @Post()
  @ApiOperation({ 
    summary: 'Tạo danh sách mua sắm',
    description: 'API này cho phép người dùng tạo một danh sách mua sắm mới. Owner có thể tạo danh sách cho thành viên khác trong gia đình.'
  })
  @ApiBody({
    type: CreateShoppingListDto,
    examples: {
      example1: {
        summary: 'Tạo danh sách mua sắm cho bản thân',
        value: {
          name: 'Danh sách mua sắm tuần này',
          family_id: 1
        }
      },
      example2: {
        summary: 'Owner tạo danh sách cho thành viên khác',
        value: {
          name: 'Danh sách mua sắm cho mẹ',
          family_id: 1,
          owner_id: 2
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Tạo danh sách mua sắm thành công',
    example: {
      id: 1,
      name: 'Danh sách mua sắm tuần này',
      family_id: 1,
      owner_id: 1,
      is_shared: false,
      created_at: '2024-01-01T00:00:00.000Z'
    }
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 403, description: 'Không có quyền tạo danh sách cho người khác' })
  async create(@Body() dto: CreateShoppingListDto, @User() user: JwtUser) {
    return await this.shoppingListService.create(dto, user);
  }

  /** GET /shopping-lists */
  @Get()
  @ApiOperation({ 
    summary: 'Lấy ra toàn bộ danh sách mua sắm',
    description: 'API này trả về danh sách tất cả các danh sách mua sắm trong hệ thống. Yêu cầu quyền admin.'
  })
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiResponse({ 
    status: 200, 
    description: 'Lấy danh sách thành công',
    example: [
      {
        id: 1,
        name: 'Danh sách mua sắm tuần này',
        family_id: 1,
        owner_id: 1,
        is_shared: false
      }
    ]
  })
  @ApiResponse({ status: 403, description: 'Không có quyền admin' })
  async findAll() {
    return await this.shoppingListService.findAll();
  }

  /** GET /shopping-lists/my-list */
  @Get('my-list')
  @ApiOperation({ 
    summary: 'Lấy danh sách mua sắm của tôi',
    description: 'API này trả về danh sách tất cả các danh sách mua sắm mà người dùng hiện tại là chủ sở hữu.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lấy danh sách thành công',
    example: [
      {
        id: 1,
        name: 'Danh sách mua sắm tuần này',
        family_id: 1,
        owner_id: 1,
        is_shared: false,
        items: []
      }
    ]
  })
  async myShoppingList(@User() user: JwtUser) {
    return await this.shoppingListService.myShoppingList(user);
  }

  /** GET /shopping-lists/:id */
  @Get(':id')
  @ApiOperation({ 
    summary: 'Lấy danh sách mua sắm theo ID',
    description: 'API này trả về thông tin chi tiết của một danh sách mua sắm theo ID, bao gồm các items trong danh sách.'
  })
  @ApiParam({ name: 'id', type: 'number', example: 1, description: 'ID của danh sách mua sắm' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lấy thông tin danh sách thành công',
    example: {
      id: 1,
      name: 'Danh sách mua sắm tuần này',
      family_id: 1,
      owner_id: 1,
      is_shared: false,
      items: [
        {
          id: 1,
          name: 'Thịt bò',
          quantity: 500,
          unit: 'g',
          is_checked: false
        }
      ]
    }
  })
  @ApiResponse({ status: 403, description: 'Không có quyền xem danh sách này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy danh sách mua sắm' })
  async findOne(@Param('id', ParseIntPipe) id: number, @User() user: JwtUser) {
    return await this.shoppingListService.findOne(id, user);
  }

  // Lấy ra danh sách các list mua sắm được share trong gia đình
  @Get('my-family-shared/:id')
  @ApiOperation({ 
    summary: 'Lấy danh sách mua sắm được share trong gia đình',
    description: 'API này trả về danh sách tất cả các danh sách mua sắm được share trong một gia đình cụ thể.'
  })
  @ApiParam({ name: 'id', type: 'number', example: 1, description: 'ID của gia đình' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lấy danh sách thành công',
    example: [
      {
        id: 1,
        name: 'Danh sách mua sắm tuần này',
        family_id: 1,
        owner_id: 1,
        is_shared: true
      }
    ]
  })
  @ApiResponse({ status: 403, description: 'Không phải thành viên của gia đình này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy gia đình' })
  async myFamilyShared(@Param('id', ParseIntPipe) id: number, @User() user: JwtUser) {
    return await this.shoppingListService.myFamilyShared(id, user);
  }

  /** PATCH /shopping-lists/:id */
  @Patch('share/:id')
  @ApiOperation({ 
    summary: 'Share danh sách với gia đình',
    description: 'API này cho phép owner share danh sách mua sắm với tất cả thành viên trong gia đình.'
  })
  @ApiParam({ name: 'id', type: 'number', example: 1, description: 'ID của danh sách mua sắm' })
  @ApiResponse({ 
    status: 200, 
    description: 'Share danh sách thành công',
    example: {
      id: 1,
      name: 'Danh sách mua sắm tuần này',
      is_shared: true,
      message: 'Danh sách đã được share với gia đình'
    }
  })
  @ApiResponse({ status: 403, description: 'Không có quyền share danh sách này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy danh sách mua sắm' })
  async shareShoppingList(@Param('id', ParseIntPipe) id: number, @User() user: JwtUser) {
    return await this.shoppingListService.shareShoppingList(id, user);
  }

  /** PATCH /shopping-lists/:id */
  @Patch(':id')
  @ApiOperation({ 
    summary: 'Cập nhật danh sách mua sắm',
    description: 'API này cho phép owner cập nhật thông tin của danh sách mua sắm như tên.'
  })
  @ApiParam({ name: 'id', type: 'number', example: 1, description: 'ID của danh sách mua sắm' })
  @ApiBody({
    type: UpdateShoppingListDto,
    examples: {
      example1: {
        summary: 'Cập nhật tên danh sách',
        value: {
          name: 'Danh sách mua sắm tuần mới'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cập nhật danh sách thành công',
    example: {
      id: 1,
      name: 'Danh sách mua sắm tuần mới',
      family_id: 1,
      owner_id: 1,
      updated_at: '2024-01-01T00:00:00.000Z'
    }
  })
  @ApiResponse({ status: 403, description: 'Không có quyền cập nhật danh sách này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy danh sách mua sắm' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateShoppingListDto, @User() user: JwtUser) {
    return await this.shoppingListService.update(id, dto, user);
  }

  /** DELETE /shopping-lists/:id */
  @Delete(':id')
  @ApiOperation({ 
    summary: 'Xóa danh sách mua sắm',
    description: 'API này cho phép owner xóa danh sách mua sắm. Lưu ý: Tất cả các items trong danh sách cũng sẽ bị xóa.'
  })
  @ApiParam({ name: 'id', type: 'number', example: 1, description: 'ID của danh sách mua sắm' })
  @ApiResponse({ 
    status: 200, 
    description: 'Xóa danh sách thành công',
    example: {
      message: 'Danh sách mua sắm đã được xóa thành công'
    }
  })
  @ApiResponse({ status: 403, description: 'Không có quyền xóa danh sách này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy danh sách mua sắm' })
  async remove(@Param('id', ParseIntPipe) id: number, @User() user: JwtUser) {
    return await this.shoppingListService.remove(id, user);
  }
}
