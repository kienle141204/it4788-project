import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { Menu } from '../../entities/menu.entity';
import { MenuDish } from '../../entities/menu-dish.entity';
import { Family } from '../../entities/family.entity';
import { Dish } from '../../entities/dish.entity';
import { FamilyMember } from '../../entities/family-member.entity';
import { User } from '../../entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Menu, MenuDish, Family, Dish, FamilyMember, User]),
    NotificationsModule,
  ],
  controllers: [MenuController],
  providers: [MenuService],
  exports: [MenuService],
})
export class MenuModule {}


