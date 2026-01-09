import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShoppingList } from '../../entities/shopping-list.entity';
import { ShoppingItem } from '../../entities/shopping-item.entity';
import { ShoppingListService } from './shopping-list.service';
import { ShoppingListController } from './shopping-list.controller';
import { ShoppingListGateway } from './shopping-list.gateway';
import { FamilyModule } from '../family/family.module';
import { MemberModule } from '../member/member.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WebSocketModule } from '../../common/websocket';
import { User } from '../../entities/user.entity';
import { FamilyMember } from '../../entities/family-member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShoppingList, ShoppingItem, User, FamilyMember]),
    FamilyModule,
    MemberModule,
    NotificationsModule,
    WebSocketModule,
  ],
  controllers: [ShoppingListController],
  providers: [ShoppingListService, ShoppingListGateway],
  exports: [ShoppingListService, ShoppingListGateway],
})
export class ShoppingListModule { }

