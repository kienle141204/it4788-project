import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefrigeratorService } from './refrigerator.service';
import { RefrigeratorController } from './refrigerator.controller';
import { FridgeDishService } from './services/fridge-dish.service';
import { FridgeIngredientService } from './services/fridge-ingredient.service';
import { Refrigerator } from '../../entities/refrigerator.entity';
import { FridgeDish } from '../../entities/fridge-dish.entity';
import { FridgeIngredient } from '../../entities/fridge-ingredient.entity';
import { Dish } from 'src/entities/dish.entity';
import { Ingredient } from 'src/entities/ingredient.entity';
import { DishesIngredients } from '../../entities/dishes-ingredients.entity';
import { FamilyModule } from '../family/family.module';

@Module({
  imports: [TypeOrmModule.forFeature([Refrigerator, FridgeDish, FridgeIngredient, Dish, Ingredient, DishesIngredients]), FamilyModule],
  controllers: [RefrigeratorController],
  providers: [RefrigeratorService, FridgeDishService, FridgeIngredientService],
  exports: [RefrigeratorService, FridgeDishService, FridgeIngredientService]
})
export class RefrigeratorModule { }
