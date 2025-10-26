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
import { DishReviewService } from './dish-review.service';
import { CreateDishReviewDto, UpdateDishReviewDto } from './dto/dish-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/dishes')
export class DishReviewController {
  constructor(private readonly dishReviewService: DishReviewService) {}

  /**
   * Lấy tất cả đánh giá của một món ăn
   * GET /dishes/:dishId/reviews
   */
  @Get(':dishId/reviews')
  async getReviewsByDishId(@Param('dishId', ParseIntPipe) dishId: number) {
    const reviews = await this.dishReviewService.getReviewsByDishId(dishId);
    return {
      success: true,
      message: `Lấy danh sách đánh giá món ăn thành công`,
      data: reviews,
    };
  }

  /**
   * Lấy thống kê đánh giá của món ăn
   * GET /dishes/:dishId/reviews/stats
   */
  @Get(':dishId/reviews/stats')
  async getDishRatingStats(@Param('dishId', ParseIntPipe) dishId: number) {
    const stats = await this.dishReviewService.getDishRatingStats(dishId);
    return {
      success: true,
      message: 'Lấy thống kê đánh giá thành công',
      data: stats,
    };
  }

  /**
   * Lấy đánh giá của user hiện tại cho món ăn
   * GET /dishes/:dishId/reviews/my-review
   */
  @Get(':dishId/reviews/my-review')
  @UseGuards(JwtAuthGuard)
  async getMyReviewForDish(
    @Param('dishId', ParseIntPipe) dishId: number,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const review = await this.dishReviewService.getUserReviewForDish(dishId, userId);
    
    return {
      success: true,
      message: review ? 'Lấy đánh giá của bạn thành công' : 'Bạn chưa đánh giá món ăn này',
      data: review,
    };
  }

  /**
   * Tạo đánh giá mới
   * POST /dishes/:dishId/reviews
   */
  @Post(':dishId/reviews')
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
