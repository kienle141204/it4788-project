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
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { RecipeService } from './recipe.service';
import { GetRecipesDto } from './dto/get-recipes.dto';
import { CreateRecipeDto, UpdateRecipeDto } from './dto/create-recipe.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../../entities/user.entity';
import { buildSuccessResponse, ResponseCode } from 'src/common/errors/error-codes';

@ApiTags('Recipes')
@Controller('api/recipes')
export class RecipeController {
  constructor(private readonly recipeService: RecipeService) { }


  @Get()
  @ApiBearerAuth('JWT-auth')
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

    return buildSuccessResponse(ResponseCode.C00112, result.data, {
      pagination: {
        currentPage: result.page,
        totalPages: result.totalPages,
        totalItems: result.total,
        itemsPerPage: result.limit,
        hasNextPage: result.page < result.totalPages,
        hasPrevPage: result.page > 1,
      },
    });
  }

  /**
   * Lấy công thức theo ID với đầy đủ thông tin
   * GET /recipes/:id
   */
  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const user: User = req.user;
    const recipe = await this.recipeService.findOneWithDetails(id, user);
    return buildSuccessResponse(ResponseCode.C00113, recipe);
  }

  /**
   * Lấy công thức theo món ăn
   * GET /recipes/by-dish/:dishId
   */
  @Get('by-dish/:dishId')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Lấy công thức theo món ăn',
    description: 'API này lấy các recipe_id từ bảng recipes theo dishId, sau đó lấy tất cả recipe_steps từ bảng recipe_steps tương ứng và trả về danh sách các bước công thức của món ăn đó.'
  })
  @ApiParam({ name: 'dishId', type: 'number', example: 1, description: 'ID của món ăn' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách các bước công thức thành công',
    example: {
      success: true,
      message: 'Lấy công thức cho món ăn ID 1 thành công',
      data: []
    }
  })
  async findByDishId(@Param('dishId', ParseIntPipe) dishId: number, @Request() req) {
    const user: User = req.user;
    const recipeSteps = await this.recipeService.findByDishId(dishId, user);
    return buildSuccessResponse(ResponseCode.C00120, recipeSteps);
  }

  /**
   * Lấy công thức của user
   * GET /recipes/by-owner/:ownerId
   */
  @Get('by-owner/:ownerId')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Lấy công thức của user',
    description: 'API này trả về danh sách công thức của một người dùng cụ thể.'
  })
  @ApiParam({ name: 'ownerId', type: 'number', example: 1, description: 'ID của người dùng' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách công thức thành công',
    example: {
      success: true,
      message: 'Lấy 5 công thức của user ID 1',
      data: []
    }
  })
  async findByOwnerId(@Param('ownerId', ParseIntPipe) ownerId: number) {
    const recipes = await this.recipeService.findByOwnerId(ownerId);
    return buildSuccessResponse(ResponseCode.C00121, recipes);
  }

  /**
   * Lấy công thức phổ biến
   * GET /recipes/popular?limit=10
   */
  @Get('popular')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Lấy công thức phổ biến',
    description: 'API này trả về danh sách các công thức phổ biến nhất trong hệ thống.'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Số lượng công thức cần lấy (mặc định: 10)' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách công thức phổ biến thành công',
    example: {
      success: true,
      message: 'Lấy 10 công thức phổ biến',
      data: []
    }
  })
  async getPopularRecipes(@Query('limit') limit?: number, @Request() req?: any) {
    const user: User = req.user;
    const recipes = await this.recipeService.getPopularRecipes(limit || 10, user);
    return buildSuccessResponse(ResponseCode.C00122, recipes);
  }

  /**
   * Tạo công thức mới
   * POST /recipes
   */
  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async createRecipe(
    @Body() createRecipeDto: CreateRecipeDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const recipe = await this.recipeService.createRecipe(createRecipeDto, userId);

    return buildSuccessResponse(ResponseCode.C00111, recipe);
  }

  /**
   * Cập nhật công thức
   * PUT /recipes/:id
   */
  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Cập nhật công thức',
    description: 'API này cho phép người dùng cập nhật công thức của mình.'
  })
  @ApiParam({ name: 'id', type: 'number', example: 1, description: 'ID của công thức' })
  @ApiBody({
    type: UpdateRecipeDto,
    examples: {
      example1: {
        summary: 'Cập nhật công thức',
        value: {
          steps: [
            {
              step_number: 1,
              description: 'Chuẩn bị nguyên liệu'
            }
          ]
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật công thức thành công',
    example: {
      success: true,
      message: 'Cập nhật công thức thành công',
      data: {
        id: 1,
        dish_id: 1,
        owner_id: 1
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Không có quyền cập nhật công thức này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy công thức' })
  async updateRecipe(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRecipeDto: UpdateRecipeDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const recipe = await this.recipeService.updateRecipe(id, updateRecipeDto, userId, userRole);

    return buildSuccessResponse(ResponseCode.C00114, recipe);
  }

  /**
   * Xóa công thức
   * DELETE /recipes/:id
   */
  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Xóa công thức',
    description: 'API này cho phép người dùng xóa công thức của mình.'
  })
  @ApiParam({ name: 'id', type: 'number', example: 1, description: 'ID của công thức' })
  @ApiResponse({
    status: 200,
    description: 'Xóa công thức thành công',
    example: {
      success: true,
      message: 'Xóa công thức thành công'
    }
  })
  @ApiResponse({ status: 403, description: 'Không có quyền xóa công thức này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy công thức' })
  async deleteRecipe(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    await this.recipeService.deleteRecipe(id, userId, userRole);

    return buildSuccessResponse(ResponseCode.C00115, { recipeId: id });
  }
}
