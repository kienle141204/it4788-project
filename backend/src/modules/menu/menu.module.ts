import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { MenuGateway } from './menu.gateway';
import { Menu } from '../../entities/menu.entity';
import { MenuDish } from '../../entities/menu-dish.entity';
import { Family } from '../../entities/family.entity';
import { Dish } from '../../entities/dish.entity';
import { FamilyMember } from '../../entities/family-member.entity';
import { User } from '../../entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { WebSocketModule } from '../../common/websocket';

@Module({
  imports: [
    TypeOrmModule.forFeature([Menu, MenuDish, Family, Dish, FamilyMember, User]),
    NotificationsModule,
    WebSocketModule,
  ],
  controllers: [MenuController],
  providers: [MenuService, MenuGateway],
  exports: [MenuService, MenuGateway],
})
export class MenuModule { }



