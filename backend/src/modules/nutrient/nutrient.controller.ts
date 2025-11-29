import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { NutrientService } from './nutrient.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Nutrients')
@Controller('api/nutrients')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class NutrientController {
  constructor(private readonly nutrientService: NutrientService) {}

  /**
   * Lấy tất cả dinh dưỡng
   * GET /api/nutrients
   */
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả dinh dưỡng' })
  async findAll() {
    const nutrients = await this.nutrientService.findAll();
    return {
      success: true,
      message: 'Lấy danh sách dinh dưỡng thành công',
      data: nutrients,
      total: nutrients.length,
    };
  }

  /**
   * Lấy thông tin dinh dưỡng của một món ăn theo ID món
   * GET /api/nutrients/dish/:dishId
   */
  @Get('dish/:dishId')
  @ApiOperation({ summary: 'Lấy thông tin dinh dưỡng của một món ăn theo ID món' })
  async getNutrientsByDishId(@Param('dishId', ParseIntPipe) dishId: number) {
    const result = await this.nutrientService.getNutrientsByDishId(dishId);
    return {
      success: true,
      message: 'Lấy thông tin dinh dưỡng của món ăn thành công',
      data: result,
      total: result.nutrients.length,
    };
  }

  /**
   * Lấy dinh dưỡng theo ID
   * GET /api/nutrients/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin dinh dưỡng theo ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const nutrient = await this.nutrientService.findOne(id);
    return {
      success: true,
      message: 'Lấy thông tin dinh dưỡng thành công',
      data: nutrient,
    };
  }
}

