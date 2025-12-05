import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsumptionHistory } from '../../entities/consumption-history.entity';
import { Family } from '../../entities/family.entity';
import { FamilyMember } from '../../entities/family-member.entity';
import { FridgeDish } from '../../entities/fridge-dish.entity'
import { FridgeIngredient } from '../../entities/fridge-ingredient.entity'
import { ConsumptionHistoryService } from './consumption-history.service';
import { ConsumptionHistoryController } from './consumption-history.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ConsumptionHistory, Family, FamilyMember, FridgeDish, FridgeIngredient])],
  controllers: [ConsumptionHistoryController],
  providers: [ConsumptionHistoryService],
  exports: [ConsumptionHistoryService],
})
export class ConsumptionHistoryModule { }
