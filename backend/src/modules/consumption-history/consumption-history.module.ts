import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsumptionHistory } from '../../entities/consumption-history.entity';
import { Family } from '../../entities/family.entity';
import { FamilyMember } from '../../entities/family-member.entity';
import { ConsumptionHistoryService } from './consumption-history.service';
import { ConsumptionHistoryController } from './consumption-history.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ConsumptionHistory, Family, FamilyMember])],
  controllers: [ConsumptionHistoryController],
  providers: [ConsumptionHistoryService],
  exports: [ConsumptionHistoryService],
})
export class ConsumptionHistoryModule { }
