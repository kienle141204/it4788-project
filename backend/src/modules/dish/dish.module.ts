import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DishController } from './dish.controller';
import { DishReviewController } from './dish-review.controller';
import { DishService } from './dish.service';
import { DishReviewService } from './dish-review.service';
import { Dish } from '../../entities/dish.entity';
import { DishReview } from '../../entities/dish-review.entity';
import { User } from '../../entities/user.entity';
import { NutrientModule } from '../nutrient/nutrient.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Dish, DishReview, User]),
    NutrientModule,
  ],
  controllers: [DishController, DishReviewController],
  providers: [DishService, DishReviewService],
  exports: [DishService, DishReviewService],
})
export class DishModule {}
