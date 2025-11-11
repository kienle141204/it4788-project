import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShoppingList } from '../../entities/shopping-list.entity';
import { ShoppingItem } from '../../entities/shopping-item.entity';
import { Ingredient } from '../../entities/ingredient.entity'
import { ShoppingItemService } from './shopping-item.service';
import { ShoppingItemController } from './shopping-item.controller';


@Module({
  imports: [TypeOrmModule.forFeature([ShoppingItem, ShoppingList, Ingredient])],
  controllers: [ShoppingItemController],
  providers: [ShoppingItemService],
  exports: [ShoppingItemService],
})
export class ShoppingItemModule { }
