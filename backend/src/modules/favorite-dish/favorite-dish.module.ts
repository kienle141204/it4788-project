import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoriteDishController } from './favorite-dish.controller';
import { FavoriteDishService } from './favorite-dish.service';
import { UserFavoriteDish } from '../../entities/user-favorite-dish.entity';
import { Dish } from '../../entities/dish.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserFavoriteDish, Dish]),
  ],
  controllers: [FavoriteDishController],
  providers: [FavoriteDishService],
  exports: [FavoriteDishService],
})
export class FavoriteDishModule {}

