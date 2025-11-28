import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DishReview } from '../../entities/dish-review.entity';
import { Dish } from '../../entities/dish.entity';
import { CreateDishReviewDto, UpdateDishReviewDto } from './dto/dish-review.dto';

@Injectable()
export class DishReviewService {
  constructor(
    @InjectRepository(DishReview)
    private dishReviewRepository: Repository<DishReview>,
    @InjectRepository(Dish)
    private dishRepository: Repository<Dish>,
  ) {}

  /**
   * Lấy tất cả đánh giá của một món ăn
   */
  async getReviewsByDishId(dishId: number, page: number, limit: number): Promise<DishReview[]> {
    const dish = await this.dishRepository.findOne({ where: { id: dishId } });
    if (!dish) {
      throw new NotFoundException('Không tìm thấy món ăn');
    }

    const skip = (page - 1) * limit;
    const [reviews, total] = await this.dishReviewRepository.findAndCount({
      where: { dish_id: dishId },
      relations: ['user'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });
    
    return reviews; 
}

  /**
   * Lấy đánh giá của user cho một món ăn
   */
  async getUserReviewForDish(dishId: number, userId: number): Promise<DishReview | null> {
    return await this.dishReviewRepository.findOne({
      where: { dish_id: dishId, user_id: userId },
      relations: ['user', 'dish'],
    });
  }

  /**
   * Tạo đánh giá mới
   */
  async createReview(
    dishId: number, 
    userId: number, 
    createDishReviewDto: CreateDishReviewDto
  ): Promise<DishReview> {
    // Kiểm tra món ăn có tồn tại không
    const dish = await this.dishRepository.findOne({ where: { id: dishId } });
    if (!dish) {
      throw new NotFoundException('Không tìm thấy món ăn');
    }

    // Kiểm tra user đã đánh giá món ăn này chưa
    const existingReview = await this.dishReviewRepository.findOne({
      where: { dish_id: dishId, user_id: userId },
    });

    if (existingReview) {
      throw new ConflictException('Bạn đã đánh giá món ăn này rồi');
    }

    // Tạo đánh giá mới
    const review = this.dishReviewRepository.create({
      dish_id: dishId,
      user_id: userId,
      rating: createDishReviewDto.rating,
      comment: createDishReviewDto.comment,
    });

    return await this.dishReviewRepository.save(review);
  }

  /**
   * Cập nhật đánh giá
   */
  async updateReview(
    reviewId: number,
    userId: number,
    updateDishReviewDto: UpdateDishReviewDto
  ): Promise<DishReview> {
    // Tìm đánh giá
    const review = await this.dishReviewRepository.findOne({
      where: { id: reviewId },
      relations: ['user', 'dish'],
    });

    if (!review) {
      throw new NotFoundException('Không tìm thấy đánh giá');
    }

    // Kiểm tra quyền sở hữu
    if (review.user_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa đánh giá này');
    }

    // Cập nhật đánh giá
    await this.dishReviewRepository.update(reviewId, {
      rating: updateDishReviewDto.rating,
      comment: updateDishReviewDto.comment,
    });

    // Trả về đánh giá đã cập nhật
    const updatedReview = await this.dishReviewRepository.findOne({
      where: { id: reviewId },
      relations: ['user', 'dish'],
    });

    if (!updatedReview) {
      throw new NotFoundException('Không tìm thấy đánh giá sau khi cập nhật');
    }

    return updatedReview;
  }

  /**
   * Xóa đánh giá
   */
  async deleteReview(reviewId: number, userId: number): Promise<void> {
    // Tìm đánh giá
    const review = await this.dishReviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Không tìm thấy đánh giá');
    }

    // Kiểm tra quyền sở hữu
    if (review.user_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa đánh giá này');
    }

    await this.dishReviewRepository.delete(reviewId);
  }

  /**
   * Lấy thống kê đánh giá của món ăn
   */
  async getDishRatingStats(dishId: number): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: { [key: number]: number };
  }> {
    const reviews = await this.dishReviewRepository.find({
      where: { dish_id: dishId },
      select: ['rating'],
    });

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = Math.round((totalRating / reviews.length) * 10) / 10; // Làm tròn 1 chữ số thập phân

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      ratingDistribution[review.rating]++;
    });

    return {
      averageRating,
      totalReviews: reviews.length,
      ratingDistribution,
    };
  }
}
