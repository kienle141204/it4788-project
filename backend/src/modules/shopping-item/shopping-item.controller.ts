import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ShoppingItemService } from './shopping-item.service';
import { CreateShoppingItemDto } from './dto/create-shopping-item.dto';
import { UpdateShoppingItemDto } from './dto/update-shopping-item.dto';

@Controller('shopping-item')
export class ShoppingItemController {
  constructor(private readonly shoppingItemService: ShoppingItemService) {}

  @Post()
  create(@Body() createShoppingItemDto: CreateShoppingItemDto) {
    return this.shoppingItemService.create(createShoppingItemDto);
  }

  @Get()
  findAll() {
    return this.shoppingItemService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shoppingItemService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateShoppingItemDto: UpdateShoppingItemDto) {
    return this.shoppingItemService.update(+id, updateShoppingItemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shoppingItemService.remove(+id);
  }
}
