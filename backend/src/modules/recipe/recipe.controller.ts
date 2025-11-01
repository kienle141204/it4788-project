import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RecipeService } from './recipe.service';
import { GetRecipesDto } from './dto/get-recipes.dto';
import { CreateRecipeDto, UpdateRecipeDto } from './dto/create-recipe.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../../entities/user.entity';

@Controller('api/recipes')
export class RecipeController {
  constructor(private readonly recipeService: RecipeService) {}


  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query() getRecipesDto: GetRecipesDto, @Request() req) {
    const user: User = req.user;
    const result = await this.recipeService.findAllWithPagination(getRecipesDto, user);
    
    let message = `Lấy danh sách công thức trang ${result.page} thành công`;
    if (getRecipesDto.dishId) {
      message += ` cho món ăn ID ${getRecipesDto.dishId}`;
    }
    if (getRecipesDto.ownerId) {
      message += ` của user ID ${getRecipesDto.ownerId}`;
    }

    return {
      success: true,
      message,
      data: result.data,
      pagination: {
        currentPage: result.page,
        totalPages: result.totalPages,
        totalItems: result.total,
        itemsPerPage: result.limit,
        hasNextPage: result.page < result.totalPages,
        hasPrevPage: result.page > 1,
      },
    };
  }

  /**
   * Lấy công thức theo ID với đầy đủ thông tin
   * GET /recipes/:id
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const user: User = req.user;
    const recipe = await this.recipeService.findOneWithDetails(id, user);
    return {
      success: true,
      message: 'Lấy thông tin công thức thành công',
      data: recipe,
    };
  }

  /**
   * Lấy công thức theo món ăn
   * GET /recipes/by-dish/:dishId
   */
  @Get('by-dish/:dishId')
  @UseGuards(JwtAuthGuard)
  async findByDishId(@Param('dishId', ParseIntPipe) dishId: number, @Request() req) {
    const user: User = req.user;
    const recipes = await this.recipeService.findByDishId(dishId, user);
    return {
      success: true,
      message: `Lấy ${recipes.length} công thức cho món ăn ID ${dishId}`,
      data: recipes,
    };
  }

  /**
   * Lấy công thức của user
   * GET /recipes/by-owner/:ownerId
   */
  @Get('by-owner/:ownerId')
  async findByOwnerId(@Param('ownerId', ParseIntPipe) ownerId: number) {
    const recipes = await this.recipeService.findByOwnerId(ownerId);
    return {
      success: true,
      message: `Lấy ${recipes.length} công thức của user ID ${ownerId}`,
      data: recipes,
    };
  }

  /**
   * Lấy công thức phổ biến
   * GET /recipes/popular?limit=10
   */
  @Get('popular')
  @UseGuards(JwtAuthGuard)
  async getPopularRecipes(@Query('limit') limit?: number, @Request() req?: any) {
    const user: User = req.user;
    const recipes = await this.recipeService.getPopularRecipes(limit || 10, user);
    return {
      success: true,
      message: `Lấy ${recipes.length} công thức phổ biến`,
      data: recipes,
    };
  }

  /**
   * Tạo công thức mới
   * POST /recipes
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createRecipe(
    @Body() createRecipeDto: CreateRecipeDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const recipe = await this.recipeService.createRecipe(createRecipeDto, userId);
    
    return {
      success: true,
      message: 'Tạo công thức thành công',
      data: recipe,
    };
  }

  /**
   * Cập nhật công thức
   * PUT /recipes/:id
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateRecipe(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRecipeDto: UpdateRecipeDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const recipe = await this.recipeService.updateRecipe(id, updateRecipeDto, userId);
    
    return {
      success: true,
      message: 'Cập nhật công thức thành công',
      data: recipe,
    };
  }

  /**
   * Xóa công thức
   * DELETE /recipes/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteRecipe(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    await this.recipeService.deleteRecipe(id, userId);
    
    return {
      success: true,
      message: 'Xóa công thức thành công',
    };
  }
}
