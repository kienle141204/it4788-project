import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShoppingStatisticsService } from './shopping-statistics.service';
import { ShoppingStatisticsController } from './shopping-statistics.controller';
import { ShoppingList } from '../../entities/shopping-list.entity';
import { ShoppingItem } from 'src/entities/shopping-item.entity';
import { Family } from '../../entities/family.entity';
import { FamilyMember } from '../../entities/family-member.entity';
import { ShoppingItemModule } from '../shopping-item/shopping-item.module';
import { ShoppingListModule } from '../shopping-list/shopping-list.module';
import { FamilyModule } from '../family/family.module';
import { MemberModule } from '../member/member.module';

@Module({
  imports: [TypeOrmModule.forFeature([ShoppingList, ShoppingItem, Family, FamilyMember]), ShoppingItemModule, ShoppingListModule, FamilyModule, MemberModule],
  controllers: [ShoppingStatisticsController],
  providers: [ShoppingStatisticsService],
  exports: [ShoppingStatisticsService],
})
export class ShoppingStatisticsModule { }
