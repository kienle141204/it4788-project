import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
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
export class RefrigeratorController {
  constructor(
    private readonly refrigeratorService: RefrigeratorService,
    private readonly fridgeDishService: FridgeDishService,
    private readonly fridgeIngredientService: FridgeIngredientService,
  ) { }

  // ---------------- Refrigerator ----------------
  @Post()
  create(@Body() dto: CreateRefrigeratorDto) {
    return this.refrigeratorService.create(dto);
  }

  @Get()
  findAll() {
    return this.refrigeratorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.refrigeratorService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRefrigeratorDto) {
    return this.refrigeratorService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.refrigeratorService.remove(id);
  }

  // ---------------- Fridge Dishes ----------------
  @Post(':id/dishes')
  addDish(@Param('id', ParseIntPipe) refrigerator_id: number, @Body() dto: CreateFridgeDishDto, @User() user: JwtUser) {
    return this.fridgeDishService.create({ ...dto, refrigerator_id }, user);
  }

  @Get(':id/dishes')
  getDishes(@Param('id', ParseIntPipe) refrigerator_id: number, @User() user: JwtUser) {
    return this.fridgeDishService.findByRefrigerator(refrigerator_id, user);
  }

  @Patch('dishes/:dishId')
  updateDish(
    @Param('dishId', ParseIntPipe) id: number,
    @Body() dto: UpdateFridgeDishDto,
    @User() user: JwtUser
  ) {
    return this.fridgeDishService.update(id, dto, user);
  }

  @Delete('dishes/:dishId')
  removeDish(@Param('dishId', ParseIntPipe) id: number, @User() user: JwtUser) {
    return this.fridgeDishService.remove(id, user);
  }

  // ---------------- Fridge Ingredients ----------------
  @Post(':id/ingredients')
  addIngredient(
    @Param('id', ParseIntPipe) refrigerator_id: number,
    @Body() dto: CreateFridgeIngredientDto,
    @User() user: JwtUser
  ) {
    return this.fridgeIngredientService.create({ ...dto, refrigerator_id }, user);
  }

  @Get(':id/ingredients')
  getIngredients(@Param('id', ParseIntPipe) refrigerator_id: number, @User() user: JwtUser) {
    return this.fridgeIngredientService.findByRefrigerator(refrigerator_id, user);
  }

  @Patch('ingredients/:ingredientId')
  updateIngredient(
    @Param('ingredientId', ParseIntPipe) id: number,
    @Body() dto: UpdateFridgeIngredientDto,
    @User() user: JwtUser
  ) {
    return this.fridgeIngredientService.update(id, dto, user);
  }

  @Delete('ingredients/:ingredientId')
  removeIngredient(@Param('ingredientId', ParseIntPipe) id: number, @User() user: JwtUser) {
    return this.fridgeIngredientService.remove(id, user);
  }
}
