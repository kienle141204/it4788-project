import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Family } from '../../entities/family.entity';
import { FamilyMember } from '../../entities/family-member.entity';
import { Refrigerator } from '../../entities/refrigerator.entity';
import { FridgeDish } from '../../entities/fridge-dish.entity';
import { FridgeIngredient } from '../../entities/fridge-ingredient.entity';
import { ShoppingList } from '../../entities/shopping-list.entity';
import { ShoppingItem } from '../../entities/shopping-item.entity';
import { Menu } from '../../entities/menu.entity';
import { MenuDish } from '../../entities/menu-dish.entity';
import { FamilyNote } from '../../entities/family-note.entity';
import { ConsumptionHistory } from '../../entities/consumption-history.entity';
import { FamilyService } from './family.service';
import { FamilyController } from './family.controller';
import { MemberModule } from '../member/member.module';
import { FirebaseModule } from '../../firebase/firebase.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Family,
      FamilyMember,
      Refrigerator,
      FridgeDish,
      FridgeIngredient,
      ShoppingList,
      ShoppingItem,
      Menu,
      MenuDish,
      FamilyNote,
      ConsumptionHistory,
    ]),
    MemberModule,
    FirebaseModule,
  ],
  controllers: [FamilyController],
  providers: [FamilyService],
  exports: [FamilyService],
})
export class FamilyModule { }
