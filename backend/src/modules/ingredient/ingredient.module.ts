import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngredientController } from './ingredient.controller';
import { IngredientService } from './ingredient.service';
import { Ingredient } from '../../entities/ingredient.entity';
import { IngredientCategory } from '../../entities/ingredient-category.entity';
import { Place } from '../../entities/place.entity';
import { DishesIngredients } from '../../entities/dishes-ingredients.entity';
import { ShoppingItem } from '../../entities/shopping-item.entity';
import { FridgeIngredient } from '../../entities/fridge-ingredient.entity';
import { ConsumptionHistory } from '../../entities/consumption-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    Ingredient, 
    IngredientCategory, 
    Place, 
    DishesIngredients,
    ShoppingItem,
    FridgeIngredient,
    ConsumptionHistory
  ])],
  controllers: [IngredientController],
  providers: [IngredientService],
  exports: [IngredientService],
})
export class IngredientModule {}
