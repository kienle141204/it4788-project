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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiBody, ApiParam } from '@nestjs/swagger';
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
  @ApiOperation({ 
    summary: 'Tạo item mới trong danh sách mua sắm',
    description: 'API này cho phép người dùng thêm một item mới vào danh sách mua sắm.'
  })
  @ApiBody({
    type: CreateShoppingItemDto,
    examples: {
      example1: {
        summary: 'Thêm item mới với đầy đủ thông tin',
        value: {
          list_id: 1,
          ingredient_id: 5,
          stock: 500,
          price: 150000,
          is_checked: false
        }
      },
      example2: {
        summary: 'Thêm item đã mua',
        value: {
          list_id: 1,
          ingredient_id: 8,
          stock: 2,
          price: 50000,
          is_checked: true
        }
      },
      example3: {
        summary: 'Thêm item tối thiểu (chỉ list_id và ingredient_id)',
        value: {
          list_id: 1,
          ingredient_id: 10
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Tạo item thành công',
    type: ShoppingItem,
    example: {
      id: 1,
      list_id: 1,
      ingredient_id: 5,
      stock: 500,
      price: 150000,
      is_checked: false,
      created_at: '2024-01-01T00:00:00.000Z'
    }
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 403, description: 'Không có quyền thêm item vào danh sách này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy danh sách mua sắm' })
  async create(@Body() dto: CreateShoppingItemDto, @User() user: JwtUser) {
    return await this.shoppingItemService.create(dto, user);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Lấy tất cả item',
    description: 'API này trả về danh sách tất cả các shopping items trong hệ thống. Yêu cầu quyền admin.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lấy danh sách item thành công',
    example: [
      {
        id: 1,
        list_id: 1,
        ingredient_id: 5,
        stock: 500,
        price: 150000,
        is_checked: false
      }
    ]
  })
  @ApiResponse({ status: 403, description: 'Không có quyền admin' })
  async findAll() {
    return await this.shoppingItemService.findAll();
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Xem chi tiết item',
    description: 'API này trả về thông tin chi tiết của một shopping item theo ID.'
  })
  @ApiParam({ name: 'id', type: 'string', example: '1', description: 'ID của shopping item' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lấy thông tin item thành công',
    example: {
      id: 1,
      list_id: 1,
      ingredient_id: 5,
      stock: 500,
      price: 150000,
      is_checked: false,
      created_at: '2024-01-01T00:00:00.000Z'
    }
  })
  @ApiResponse({ status: 403, description: 'Không có quyền xem item này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy item' })
  async findOne(@Param('id') id: string, @User() user: JwtUser) {
    return await this.shoppingItemService.findOne(+id, user);
  }

  @Patch('check/:id')
  @ApiOperation({ 
    summary: 'Đánh dấu đã mua item',
    description: 'API này cho phép đánh dấu một item là đã mua (check/uncheck).'
  })
  @ApiParam({ name: 'id', type: 'string', example: '1', description: 'ID của shopping item' })
  @ApiResponse({ 
    status: 200, 
    description: 'Cập nhật trạng thái thành công',
    example: {
      id: 1,
      list_id: 1,
      ingredient_id: 5,
      is_checked: true,
      message: 'Item đã được đánh dấu là đã mua'
    }
  })
  @ApiResponse({ status: 403, description: 'Không có quyền cập nhật item này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy item' })
  async check(@Param('id') id: string, @User() user: JwtUser) {
    return await this.shoppingItemService.check(+id, user);
  }

  @Patch(':id/toggle')
  @ApiOperation({ 
    summary: 'Toggle trạng thái checked của item',
    description: 'API này cho phép chuyển đổi trạng thái checked/unchecked của một shopping item.'
  })
  @ApiParam({ name: 'id', type: 'string', example: '1', description: 'ID của shopping item' })
  @ApiResponse({ 
    status: 200, 
    description: 'Toggle trạng thái thành công',
    type: ShoppingItem,
    example: {
      id: 1,
      list_id: 1,
      ingredient_id: 5,
      stock: 500,
      price: 150000,
      is_checked: true,
      created_at: '2024-01-01T00:00:00.000Z'
    }
  })
  @ApiResponse({ status: 403, description: 'Không có quyền cập nhật item này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy item' })
  async toggle(@Param('id') id: string, @User() user: JwtUser) {
    return await this.shoppingItemService.check(+id, user);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Cập nhật item',
    description: 'API này cho phép cập nhật thông tin của một shopping item như tên, số lượng, đơn vị.'
  })
  @ApiParam({ name: 'id', type: 'string', example: '1', description: 'ID của shopping item' })
  @ApiBody({
    type: UpdateShoppingItemDto,
    examples: {
      example1: {
        summary: 'Cập nhật số lượng và giá',
        value: {
          stock: 1000,
          price: 200000
        }
      },
      example2: {
        summary: 'Cập nhật trạng thái',
        value: {
          is_checked: true
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cập nhật item thành công',
    example: {
      id: 1,
      list_id: 1,
      ingredient_id: 5,
      stock: 1000,
      price: 200000,
      is_checked: false,
      updated_at: '2024-01-01T00:00:00.000Z'
    }
  })
  @ApiResponse({ status: 403, description: 'Không có quyền cập nhật item này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy item' })
  async update(@Param('id') id: string, @Body() dto: UpdateShoppingItemDto, @User() user: JwtUser) {
    return await this.shoppingItemService.update(+id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Xóa item',
    description: 'API này cho phép xóa một shopping item khỏi danh sách mua sắm.'
  })
  @ApiParam({ name: 'id', type: 'string', example: '1', description: 'ID của shopping item' })
  @ApiResponse({ 
    status: 200, 
    description: 'Xóa item thành công',
    example: {
      message: 'Item đã được xóa thành công'
    }
  })
  @ApiResponse({ status: 403, description: 'Không có quyền xóa item này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy item' })
  async remove(@Param('id') id: string, @User() user: JwtUser) {
    return await this.shoppingItemService.remove(+id, user);
  }
}
