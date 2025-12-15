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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DishReviewService } from './dish-review.service';
import { CreateDishReviewDto, UpdateDishReviewDto } from './dto/dish-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseCode, buildSuccessResponse } from 'src/common';

@ApiTags('Dish Reviews')
@Controller('api/dishes')
export class DishReviewController {
  constructor(private readonly dishReviewService: DishReviewService) {}

  /**
   * Lấy tất cả đánh giá của một món ăn
   * GET /dishes/:dishId/reviews
   */
  @Get(':dishId/reviews')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async getReviewsByDishId(@Param('dishId', ParseIntPipe) dishId: number, @Query('page') page: number, @Query('limit') limit: number) {
    const reviews = await this.dishReviewService.getReviewsByDishId(dishId, page, limit);
    return buildSuccessResponse(ResponseCode.C00152, reviews);
  }

  /**
   * Lấy thống kê đánh giá của món ăn
   * GET /dishes/:dishId/reviews/stats
   */
  @Get(':dishId/reviews/stats')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async getDishRatingStats(@Param('dishId', ParseIntPipe) dishId: number) {
    const stats = await this.dishReviewService.getDishRatingStats(dishId);
    return buildSuccessResponse(ResponseCode.C00153, stats);
  }

  /**
   * Lấy đánh giá của user hiện tại cho món ăn
   * GET /dishes/:dishId/reviews/my-review
   */
  @Get(':dishId/reviews/my-review')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async getMyReviewForDish(
    @Param('dishId', ParseIntPipe) dishId: number,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const review = await this.dishReviewService.getUserReviewForDish(dishId, userId);
    
    return buildSuccessResponse(ResponseCode.C00152, review);
  }

  /**
   * Tạo đánh giá mới
   * POST /dishes/:dishId/reviews
   */
  @Post(':dishId/reviews')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async createReview(
    @Param('dishId', ParseIntPipe) dishId: number,
    @Body() createDishReviewDto: CreateDishReviewDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const review = await this.dishReviewService.createReview(
      dishId,
      userId,
      createDishReviewDto,
    );

    return {
      success: true,
      message: 'Tạo đánh giá thành công',
      data: review,
    };
  }

  /**
   * Cập nhật đánh giá
   * PUT /dishes/reviews/:reviewId
   */
  @Put('reviews/:reviewId')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async updateReview(
    @Param('reviewId', ParseIntPipe) reviewId: number,
    @Body() updateDishReviewDto: UpdateDishReviewDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const review = await this.dishReviewService.updateReview(
      reviewId,
      userId,
      updateDishReviewDto,
    );

    return {
      success: true,
      message: 'Cập nhật đánh giá thành công',
      data: review,
    };
  }

  /**
   * Xóa đánh giá
   * DELETE /dishes/reviews/:reviewId
   */
  @Delete('reviews/:reviewId')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async deleteReview(
    @Param('reviewId', ParseIntPipe) reviewId: number,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    await this.dishReviewService.deleteReview(reviewId, userId);

    return {
      success: true,
      message: 'Xóa đánh giá thành công',
    };
  }
}
