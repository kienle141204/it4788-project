import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngredientController } from './ingredient.controller';
import { IngredientService } from './ingredient.service';
import { Ingredient } from '../../entities/ingredient.entity';
import { IngredientCategory } from '../../entities/ingredient-category.entity';
import { Place } from '../../entities/place.entity';
import { DishesIngredients } from '../../entities/dishes-ingredients.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ingredient, IngredientCategory, Place, DishesIngredients])],
  controllers: [IngredientController],
  providers: [IngredientService],
  exports: [IngredientService],
})
export class IngredientModule {}
