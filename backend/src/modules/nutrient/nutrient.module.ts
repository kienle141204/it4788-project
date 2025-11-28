import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Nutrient } from '../../entities/nutrient.entity';
import { Dish } from '../../entities/dish.entity';
import { NutrientService } from './nutrient.service';
import { NutrientController } from './nutrient.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Nutrient, Dish])],
  controllers: [NutrientController],
  providers: [NutrientService],
  exports: [NutrientService],
})
export class NutrientModule {}

