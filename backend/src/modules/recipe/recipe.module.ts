import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecipeController } from './recipe.controller';
import { RecipeService } from './recipe.service';
import { Recipe } from '../../entities/recipe.entity';
import { RecipeStep } from '../../entities/recipe-step.entity';
import { Dish } from '../../entities/dish.entity';
import { User } from '../../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Recipe, RecipeStep, Dish, User])],
  controllers: [RecipeController],
  providers: [RecipeService],
  exports: [RecipeService],
})
export class RecipeModule {}
