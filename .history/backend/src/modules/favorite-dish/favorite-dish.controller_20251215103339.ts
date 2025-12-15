import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { FavoriteDishService } from './favorite-dish.service';
import { CreateFavoriteDishDto } from './dto/create-favorite-dish.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseCode, buildSuccessResponse } from 'src/common';

@ApiTags('Favorite Dishes')
@Controller('api/favorite-dishes')
export class FavoriteDishController {
  constructor(private readonly favoriteDishService: FavoriteDishService) {}

  /**
   * Thêm món ăn vào danh sách yêu thích
   * POST /api/favorite-dishes
   */
  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Thêm món ăn vào danh sách yêu thích',
    description: 'API này cho phép người dùng thêm món ăn vào danh sách yêu thích của mình. Yêu cầu đăng nhập.',
  })
  @ApiBody({
    type: CreateFavoriteDishDto,
    examples: {
      example1: {
        summary: 'Thêm món ăn yêu thích',
        value: {
          dish_id: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Thêm món ăn yêu thích thành công',
    example: {
      success: true,
      message: 'Thêm món ăn vào danh sách yêu thích thành công',
      data: {
        id: 1,
        user_id: 1,
        dish_id: 1,
        created_at: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy món ăn' })
  @ApiResponse({ status: 409, description: 'Món ăn đã có trong danh sách yêu thích' })
  async addFavoriteDish(
    @Body() createFavoriteDishDto: CreateFavoriteDishDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const favorite = await this.favoriteDishService.addFavoriteDish(userId, createFavoriteDishDto);
    
    return buildSuccessResponse(ResponseCode.C00161, favorite);
  }

  /**
   * Lấy danh sách món ăn yêu thích của user
   * GET /api/favorite-dishes
   */
  @Get()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Lấy danh sách món ăn yêu thích',
    description: 'API này trả về danh sách tất cả món ăn yêu thích của người dùng hiện tại. Yêu cầu đăng nhập.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách món ăn yêu thích thành công',
    example: {
      success: true,
      message: 'Lấy danh sách món ăn yêu thích thành công',
      data: [
        {
          id: 1,
          user_id: 1,
          dish_id: 1,
          created_at: '2024-01-01T00:00:00.000Z',
          dish: {
            id: 1,
            name: 'Phở Bò',
            description: 'Món phở truyền thống',
            image_url: 'https://example.com/pho.jpg',
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async getFavoriteDishes(@Request() req: any) {
    const userId = req.user.id;
    const favorites = await this.favoriteDishService.getFavoriteDishes(userId);
    
    return buildSuccessResponse(ResponseCode.C00162, favorites);
  }

  /**
   * Lấy thông tin chi tiết một món ăn yêu thích theo dish_id
   * GET /api/favorite-dishes/dish/:dishId
   */
  @Get('dish/:dishId')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Lấy thông tin chi tiết món ăn yêu thích',
    description: 'API này trả về thông tin chi tiết của một món ăn yêu thích theo dish_id. Yêu cầu đăng nhập.',
  })
  @ApiParam({ name: 'dishId', type: 'number', example: 1, description: 'ID của món ăn' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin món ăn yêu thích thành công',
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy món ăn yêu thích' })
  async getFavoriteDishByDishId(
    @Param('dishId', ParseIntPipe) dishId: number,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const favorite = await this.favoriteDishService.getFavoriteDishByDishId(userId, dishId);
    
    return buildSuccessResponse(ResponseCode.C00163, favorite);
  }

  /**
   * Kiểm tra món ăn có trong danh sách yêu thích không
   * GET /api/favorite-dishes/check/:dishId
   */
  @Get('check/:dishId')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Kiểm tra món ăn có trong danh sách yêu thích',
    description: 'API này kiểm tra xem một món ăn có trong danh sách yêu thích của người dùng hiện tại không. Yêu cầu đăng nhập.',
  })
  @ApiParam({ name: 'dishId', type: 'number', example: 1, description: 'ID của món ăn' })
  @ApiResponse({
    status: 200,
    description: 'Kiểm tra thành công',
    example: {
      success: true,
      message: 'Kiểm tra thành công',
      data: {
        isFavorite: true,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async checkIfFavorite(
    @Param('dishId', ParseIntPipe) dishId: number,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const isFavorite = await this.favoriteDishService.checkIfFavorite(userId, dishId);
    
    return buildSuccessResponse(ResponseCode.C00165, { isFavorite });
  }

  /**
   * Xóa món ăn khỏi danh sách yêu thích
   * DELETE /api/favorite-dishes/dish/:dishId
   */
  @Delete('dish/:dishId')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Xóa món ăn khỏi danh sách yêu thích',
    description: 'API này cho phép người dùng xóa món ăn khỏi danh sách yêu thích của mình bằng dish_id. Yêu cầu đăng nhập.',
  })
  @ApiParam({ name: 'dishId', type: 'number', example: 1, description: 'ID của món ăn' })
  @ApiResponse({
    status: 200,
    description: 'Xóa món ăn khỏi danh sách yêu thích thành công',
    example: {
      success: true,
      message: 'Xóa món ăn khỏi danh sách yêu thích thành công',
    },
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Món ăn không có trong danh sách yêu thích' })
  async removeFavoriteDish(
    @Param('dishId', ParseIntPipe) dishId: number,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    await this.favoriteDishService.removeFavoriteDish(userId, dishId);
    
    return buildSuccessResponse(ResponseCode.C00164);
  }
}

