import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiBody, ApiParam } from '@nestjs/swagger';
import { RefrigeratorService } from './refrigerator.service';
import { FridgeDishService } from './services/fridge-dish.service';
import { FridgeIngredientService } from './services/fridge-ingredient.service';
import { CreateRefrigeratorDto } from './dto/create-refrigerator.dto';
import { UpdateRefrigeratorDto } from './dto/update-refrigerator.dto';
import { CreateFridgeDishDto } from './dto/create-fridge-dish.dto';
import { UpdateFridgeDishDto } from './dto/update-fridge-dish.dto';
import { CreateFridgeIngredientDto } from './dto/create-fridge-ingredient.dto';
import { UpdateFridgeIngredientDto } from './dto/update-fridge-ingredient.dto';
import { User, Roles, Owner, JwtAuthGuard, RolesGuard, OwnerGuard, SelfOrAdminGuard } from 'src/common';
import type { JwtUser } from '../../common/types/user.type';

@ApiTags('Refrigerators')
@Controller('api/fridge')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class RefrigeratorController {
  constructor(
    private readonly refrigeratorService: RefrigeratorService,
    private readonly fridgeDishService: FridgeDishService,
    private readonly fridgeIngredientService: FridgeIngredientService,
  ) { }

  // ---------------- Refrigerator ----------------
  @Post()
  @ApiOperation({ 
    summary: 'Tạo tủ lạnh',
    description: 'API này cho phép người dùng tạo một tủ lạnh mới cho bản thân hoặc cho gia đình (nếu là owner).'
  })
  @ApiBody({
    type: CreateRefrigeratorDto,
    examples: {
      example1: {
        summary: 'Tạo tủ lạnh cho gia đình',
        value: {
          name: 'Tủ lạnh nhà bếp',
          family_id: 1
        }
      },
      example2: {
        summary: 'Tạo tủ lạnh cá nhân',
        value: {
          name: 'Tủ lạnh phòng trọ'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Tạo tủ lạnh thành công',
    example: {
      id: 1,
      name: 'Tủ lạnh nhà bếp',
      family_id: 1,
      owner_id: 1,
      created_at: '2024-01-01T00:00:00.000Z'
    }
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 403, description: 'Không có quyền tạo tủ lạnh cho gia đình này' })
  async create(@Body() dto: CreateRefrigeratorDto, @User() user: JwtUser) {
    return await this.refrigeratorService.create(dto, user);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Lấy ra toàn bộ tủ lạnh',
    description: 'API này trả về danh sách tất cả các tủ lạnh trong hệ thống. Yêu cầu quyền admin.'
  })
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiResponse({ 
    status: 200, 
    description: 'Lấy danh sách tủ lạnh thành công',
    example: [
      {
        id: 1,
        name: 'Tủ lạnh nhà bếp',
        family_id: 1,
        owner_id: 1
      }
    ]
  })
  @ApiResponse({ status: 403, description: 'Không có quyền admin' })
  async findAll() {
    return await this.refrigeratorService.findAll();
  }

  @Get('my-frifge')
  @ApiOperation({ 
    summary: 'Lấy tủ lạnh của tôi',
    description: 'API này trả về danh sách tất cả các tủ lạnh mà người dùng hiện tại là chủ sở hữu.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lấy danh sách tủ lạnh thành công',
    example: [
      {
        id: 1,
        name: 'Tủ lạnh nhà bếp',
        family_id: 1,
        owner_id: 1
      }
    ]
  })
  async myFridge(@User() user: JwtUser) {
    return await this.refrigeratorService.myFridge(user);
  }

  @Get('my-family/:id')
  @ApiOperation({ 
    summary: 'Lấy tủ lạnh của gia đình',
    description: 'API này trả về danh sách tất cả các tủ lạnh của một gia đình cụ thể.'
  })
  @ApiParam({ name: 'id', type: 'number', example: 1, description: 'ID của gia đình' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lấy danh sách tủ lạnh thành công',
    example: [
      {
        id: 1,
        name: 'Tủ lạnh nhà bếp',
        family_id: 1,
        owner_id: 1
      }
    ]
  })
  @ApiResponse({ status: 403, description: 'Không phải thành viên của gia đình này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy gia đình' })
  async myFamilyFridge(@Param('id', ParseIntPipe) id: number, @User() user: JwtUser) {
    return await this.refrigeratorService.myFamilyFridge(id, user);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Lấy tủ lạnh theo ID',
    description: 'API này trả về thông tin chi tiết của một tủ lạnh theo ID, bao gồm danh sách món ăn và nguyên liệu.'
  })
  @ApiParam({ name: 'id', type: 'number', example: 1, description: 'ID của tủ lạnh' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lấy thông tin tủ lạnh thành công',
    example: {
      id: 1,
      name: 'Tủ lạnh nhà bếp',
      family_id: 1,
      owner_id: 1,
      dishes: [],
      ingredients: []
    }
  })
  @ApiResponse({ status: 403, description: 'Không có quyền xem tủ lạnh này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy tủ lạnh' })
  async findOne(@Param('id', ParseIntPipe) id: number, @User() user: JwtUser) {
    return await this.refrigeratorService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Cập nhật tủ lạnh',
    description: 'API này cho phép owner cập nhật thông tin của tủ lạnh như tên.'
  })
  @ApiParam({ name: 'id', type: 'number', example: 1, description: 'ID của tủ lạnh' })
  @ApiBody({
    type: UpdateRefrigeratorDto,
    examples: {
      example1: {
        summary: 'Cập nhật tên tủ lạnh',
        value: {
          name: 'Tủ lạnh phòng khách'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cập nhật tủ lạnh thành công',
    example: {
      id: 1,
      name: 'Tủ lạnh phòng khách',
      family_id: 1,
      owner_id: 1,
      updated_at: '2024-01-01T00:00:00.000Z'
    }
  })
  @ApiResponse({ status: 403, description: 'Không có quyền cập nhật tủ lạnh này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy tủ lạnh' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRefrigeratorDto, @User() user: JwtUser) {
    return await this.refrigeratorService.update(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Xóa tủ lạnh',
    description: 'API này cho phép owner xóa tủ lạnh. Lưu ý: Tất cả món ăn và nguyên liệu trong tủ lạnh cũng sẽ bị xóa.'
  })
  @ApiParam({ name: 'id', type: 'number', example: 1, description: 'ID của tủ lạnh' })
  @ApiResponse({ 
    status: 200, 
    description: 'Xóa tủ lạnh thành công',
    example: {
      message: 'Tủ lạnh đã được xóa thành công'
    }
  })
  @ApiResponse({ status: 403, description: 'Không có quyền xóa tủ lạnh này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy tủ lạnh' })
  async remove(@Param('id', ParseIntPipe) id: number, @User() user: JwtUser) {
    return await this.refrigeratorService.remove(id, user);
  }

  // ---------------- Fridge Dishes ----------------
  @Post(':id/dishes')
  @ApiOperation({ 
    summary: 'Thêm món ăn vào tủ lạnh',
    description: 'API này cho phép thêm một món ăn vào tủ lạnh với số lượng và ngày hết hạn.'
  })
  @ApiParam({ name: 'id', type: 'number', example: 1, description: 'ID của tủ lạnh' })
  @ApiBody({
    type: CreateFridgeDishDto,
    examples: {
      example1: {
        summary: 'Thêm món ăn vào tủ lạnh',
        value: {
          dish_id: 1,
          quantity: 2,
          expiry_date: '2024-01-10'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Thêm món ăn thành công',
    example: {
      id: 1,
      refrigerator_id: 1,
      dish_id: 1,
      quantity: 2,
      expiry_date: '2024-01-10',
      created_at: '2024-01-01T00:00:00.000Z'
    }
  })
  @ApiResponse({ status: 403, description: 'Không có quyền thêm món ăn vào tủ lạnh này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy tủ lạnh hoặc món ăn' })
  async addDish(@Param('id', ParseIntPipe) refrigerator_id: number, @Body() dto: CreateFridgeDishDto, @User() user: JwtUser) {
    return await this.fridgeDishService.create(refrigerator_id, dto, user);
  }

  @Get(':id/dishes')
  @ApiOperation({ 
    summary: 'Lấy danh sách món ăn trong tủ lạnh',
    description: 'API này trả về danh sách tất cả các món ăn trong một tủ lạnh cụ thể.'
  })
  @ApiParam({ name: 'id', type: 'number', example: 1, description: 'ID của tủ lạnh' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lấy danh sách món ăn thành công',
    example: [
      {
        id: 1,
        refrigerator_id: 1,
        dish_id: 1,
        quantity: 2,
        expiry_date: '2024-01-10',
        dish: {
          id: 1,
          name: 'Phở Bò'
        }
      }
    ]
  })
  @ApiResponse({ status: 403, description: 'Không có quyền xem tủ lạnh này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy tủ lạnh' })
  async getDishes(@Param('id', ParseIntPipe) refrigerator_id: number, @User() user: JwtUser) {
    return await this.fridgeDishService.findByRefrigerator(refrigerator_id, user);
  }

  @Patch('dishes/:dishId')
  @ApiOperation({ 
    summary: 'Cập nhật món ăn trong tủ lạnh',
    description: 'API này cho phép cập nhật thông tin món ăn trong tủ lạnh như số lượng hoặc ngày hết hạn.'
  })
  @ApiParam({ name: 'dishId', type: 'number', example: 1, description: 'ID của fridge dish' })
  @ApiBody({
    type: UpdateFridgeDishDto,
    examples: {
      example1: {
        summary: 'Cập nhật số lượng',
        value: {
          quantity: 3
        }
      },
      example2: {
        summary: 'Cập nhật ngày hết hạn',
        value: {
          expiry_date: '2024-01-15'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cập nhật món ăn thành công',
    example: {
      id: 1,
      refrigerator_id: 1,
      dish_id: 1,
      quantity: 3,
      expiry_date: '2024-01-15',
      updated_at: '2024-01-01T00:00:00.000Z'
    }
  })
  @ApiResponse({ status: 403, description: 'Không có quyền cập nhật món ăn này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy món ăn' })
  async updateDish(
    @Param('dishId', ParseIntPipe) id: number,
    @Body() dto: UpdateFridgeDishDto,
    @User() user: JwtUser
  ) {
    return await this.fridgeDishService.update(id, dto, user);
  }

  @Delete('dishes/:dishId')
  @ApiOperation({ 
    summary: 'Xóa món ăn khỏi tủ lạnh',
    description: 'API này cho phép xóa một món ăn khỏi tủ lạnh.'
  })
  @ApiParam({ name: 'dishId', type: 'number', example: 1, description: 'ID của fridge dish' })
  @ApiResponse({ 
    status: 200, 
    description: 'Xóa món ăn thành công',
    example: {
      message: 'Món ăn đã được xóa khỏi tủ lạnh thành công'
    }
  })
  @ApiResponse({ status: 403, description: 'Không có quyền xóa món ăn này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy món ăn' })
  async removeDish(@Param('dishId', ParseIntPipe) id: number, @User() user: JwtUser) {
    return await this.fridgeDishService.remove(id, user);
  }

  // ---------------- Fridge Ingredients ----------------
  @Post(':id/ingredients')
  @ApiOperation({ 
    summary: 'Thêm nguyên liệu vào tủ lạnh',
    description: 'API này cho phép thêm một nguyên liệu vào tủ lạnh với số lượng và ngày hết hạn.'
  })
  @ApiParam({ name: 'id', type: 'number', example: 1, description: 'ID của tủ lạnh' })
  @ApiBody({
    type: CreateFridgeIngredientDto,
    examples: {
      example1: {
        summary: 'Thêm nguyên liệu vào tủ lạnh',
        value: {
          ingredient_id: 1,
          quantity: 500,
          unit: 'g',
          expiry_date: '2024-01-10'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Thêm nguyên liệu thành công',
    example: {
      id: 1,
      refrigerator_id: 1,
      ingredient_id: 1,
      quantity: 500,
      unit: 'g',
      expiry_date: '2024-01-10',
      created_at: '2024-01-01T00:00:00.000Z'
    }
  })
  @ApiResponse({ status: 403, description: 'Không có quyền thêm nguyên liệu vào tủ lạnh này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy tủ lạnh hoặc nguyên liệu' })
  async addIngredient(
    @Param('id', ParseIntPipe) refrigerator_id: number,
    @Body() dto: CreateFridgeIngredientDto,
    @User() user: JwtUser
  ) {
    return await this.fridgeIngredientService.create(refrigerator_id, dto, user);
  }

  @Get(':id/ingredients')
  @ApiOperation({ 
    summary: 'Lấy danh sách nguyên liệu trong tủ lạnh',
    description: 'API này trả về danh sách tất cả các nguyên liệu trong một tủ lạnh cụ thể.'
  })
  @ApiParam({ name: 'id', type: 'number', example: 1, description: 'ID của tủ lạnh' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lấy danh sách nguyên liệu thành công',
    example: [
      {
        id: 1,
        refrigerator_id: 1,
        ingredient_id: 1,
        quantity: 500,
        unit: 'g',
        expiry_date: '2024-01-10',
        ingredient: {
          id: 1,
          name: 'Thịt bò'
        }
      }
    ]
  })
  @ApiResponse({ status: 403, description: 'Không có quyền xem tủ lạnh này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy tủ lạnh' })
  async getIngredients(@Param('id', ParseIntPipe) refrigerator_id: number, @User() user: JwtUser) {
    return await this.fridgeIngredientService.findByRefrigerator(refrigerator_id, user);
  }

  @Patch('ingredients/:ingredientId')
  @ApiOperation({ 
    summary: 'Cập nhật nguyên liệu trong tủ lạnh',
    description: 'API này cho phép cập nhật thông tin nguyên liệu trong tủ lạnh như số lượng, đơn vị hoặc ngày hết hạn.'
  })
  @ApiParam({ name: 'ingredientId', type: 'number', example: 1, description: 'ID của fridge ingredient' })
  @ApiBody({
    type: UpdateFridgeIngredientDto,
    examples: {
      example1: {
        summary: 'Cập nhật số lượng',
        value: {
          quantity: 1000,
          unit: 'g'
        }
      },
      example2: {
        summary: 'Cập nhật ngày hết hạn',
        value: {
          expiry_date: '2024-01-15'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cập nhật nguyên liệu thành công',
    example: {
      id: 1,
      refrigerator_id: 1,
      ingredient_id: 1,
      quantity: 1000,
      unit: 'g',
      expiry_date: '2024-01-15',
      updated_at: '2024-01-01T00:00:00.000Z'
    }
  })
  @ApiResponse({ status: 403, description: 'Không có quyền cập nhật nguyên liệu này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy nguyên liệu' })
  async updateIngredient(
    @Param('ingredientId', ParseIntPipe) id: number,
    @Body() dto: UpdateFridgeIngredientDto,
    @User() user: JwtUser
  ) {
    return await this.fridgeIngredientService.update(id, dto, user);
  }

  @Delete('ingredients/:ingredientId')
  @ApiOperation({ 
    summary: 'Xóa nguyên liệu khỏi tủ lạnh',
    description: 'API này cho phép xóa một nguyên liệu khỏi tủ lạnh.'
  })
  @ApiParam({ name: 'ingredientId', type: 'number', example: 1, description: 'ID của fridge ingredient' })
  @ApiResponse({ 
    status: 200, 
    description: 'Xóa nguyên liệu thành công',
    example: {
      message: 'Nguyên liệu đã được xóa khỏi tủ lạnh thành công'
    }
  })
  @ApiResponse({ status: 403, description: 'Không có quyền xóa nguyên liệu này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy nguyên liệu' })
  async removeIngredient(@Param('ingredientId', ParseIntPipe) id: number, @User() user: JwtUser) {
    return await this.fridgeIngredientService.remove(id, user);
  }
}
