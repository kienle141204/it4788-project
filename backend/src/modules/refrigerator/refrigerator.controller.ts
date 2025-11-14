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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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

@Controller('api/fridge')
@UseGuards(JwtAuthGuard)
export class RefrigeratorController {
  constructor(
    private readonly refrigeratorService: RefrigeratorService,
    private readonly fridgeDishService: FridgeDishService,
    private readonly fridgeIngredientService: FridgeIngredientService,
  ) { }

  // ---------------- Refrigerator ----------------
  @Post()
  @ApiOperation({ summary: 'Tạo tủ lạnh cho bản thân hoặc gia đình (nếu là owner)' })
  async create(@Body() dto: CreateRefrigeratorDto, @User() user: JwtUser) {
    return await this.refrigeratorService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy ra toàn bộ tủ lạnh' })
  @UseGuards(RolesGuard)
  @Roles('admin')
  async findAll() {
    return await this.refrigeratorService.findAll();
  }

  @Get('my-frifge')
  @ApiOperation({ summary: 'Lấy ra tủ lạnh mình làm chủ' })
  async myFridge(@User() user: JwtUser) {
    return await this.refrigeratorService.myFridge(user);
  }

  @Get('my-family/:id')
  @ApiOperation({ summary: 'Lấy ra tủ lạnh của gia đình' })
  async myFamilyFridge(@Param('id', ParseIntPipe) id: number, @User() user: JwtUser) {
    return await this.refrigeratorService.myFamilyFridge(id, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy ra tủ lạnh theo id' })
  async findOne(@Param('id', ParseIntPipe) id: number, @User() user: JwtUser) {
    return await this.refrigeratorService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật tủ lạnh theo id' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRefrigeratorDto, @User() user: JwtUser) {
    return await this.refrigeratorService.update(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa tủ lạnh theo id' })
  async remove(@Param('id', ParseIntPipe) id: number, @User() user: JwtUser) {
    return await this.refrigeratorService.remove(id, user);
  }

  // ---------------- Fridge Dishes ----------------
  @Post(':id/dishes')
  @ApiOperation({ summary: 'Tạo món ăn bỏ vào tủ lạnh có id' })
  async addDish(@Param('id', ParseIntPipe) refrigerator_id: number, @Body() dto: CreateFridgeDishDto, @User() user: JwtUser) {
    return await this.fridgeDishService.create(refrigerator_id, dto, user);
  }

  @Get(':id/dishes')
  @ApiOperation({ summary: 'Lấy ra các món ăn trong tủ lạnh có id' })
  async getDishes(@Param('id', ParseIntPipe) refrigerator_id: number, @User() user: JwtUser) {
    return await this.fridgeDishService.findByRefrigerator(refrigerator_id, user);
  }

  @Patch('dishes/:dishId')
  @ApiOperation({ summary: 'Cập nhật món ăn trong tủ lạnh' })
  async updateDish(
    @Param('dishId', ParseIntPipe) id: number,
    @Body() dto: UpdateFridgeDishDto,
    @User() user: JwtUser
  ) {
    return await this.fridgeDishService.update(id, dto, user);
  }

  @Delete('dishes/:dishId')
  @ApiOperation({ summary: 'Xóa món ăn khỏi tủ lạnh' })
  async removeDish(@Param('dishId', ParseIntPipe) id: number, @User() user: JwtUser) {
    return await this.fridgeDishService.remove(id, user);
  }

  // ---------------- Fridge Ingredients ----------------
  @Post(':id/ingredients')
  @ApiOperation({ summary: 'Tạo nguyên liệu bỏ vào tủ lạnh có id' })
  async addIngredient(
    @Param('id', ParseIntPipe) refrigerator_id: number,
    @Body() dto: CreateFridgeIngredientDto,
    @User() user: JwtUser
  ) {
    return await this.fridgeIngredientService.create(refrigerator_id, dto, user);
  }

  @Get(':id/ingredients')
  @ApiOperation({ summary: 'Lấy ra các nguyên liệu trong tủ lạnh có id' })
  async getIngredients(@Param('id', ParseIntPipe) refrigerator_id: number, @User() user: JwtUser) {
    return await this.fridgeIngredientService.findByRefrigerator(refrigerator_id, user);
  }

  @Patch('ingredients/:ingredientId')
  @ApiOperation({ summary: 'Cập nhật nguyên liệu trong tủ lạnh' })
  async updateIngredient(
    @Param('ingredientId', ParseIntPipe) id: number,
    @Body() dto: UpdateFridgeIngredientDto,
    @User() user: JwtUser
  ) {
    return await this.fridgeIngredientService.update(id, dto, user);
  }

  @Delete('ingredients/:ingredientId')
  @ApiOperation({ summary: 'Xóa nguyên liệu khỏi tủ lạnh' })
  async removeIngredient(@Param('ingredientId', ParseIntPipe) id: number, @User() user: JwtUser) {
    return await this.fridgeIngredientService.remove(id, user);
  }
}
