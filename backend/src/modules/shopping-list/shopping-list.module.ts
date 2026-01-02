import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShoppingList } from '../../entities/shopping-list.entity';
import { ShoppingItem } from '../../entities/shopping-item.entity';
import { ShoppingListService } from './shopping-list.service';
import { ShoppingListController } from './shopping-list.controller';
import { FamilyModule } from '../family/family.module';
import { MemberModule } from '../member/member.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { User } from '../../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShoppingList, ShoppingItem, User]),
    FamilyModule,
    MemberModule,
    NotificationsModule,
  ],
  controllers: [ShoppingListController],
  providers: [ShoppingListService],
  exports: [ShoppingListService],
})
export class ShoppingListModule { }
