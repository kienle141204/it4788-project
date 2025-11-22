import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShoppingList } from '../../entities/shopping-list.entity';
import { ShoppingItem } from '../../entities/shopping-item.entity';
import { ShoppingListService } from './shopping-list.service';
import { ShoppingListController } from './shopping-list.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ShoppingList, ShoppingItem])],
  controllers: [ShoppingListController],
  providers: [ShoppingListService],
  exports: [TypeOrmModule],
})
export class ShoppingListModule { }
