import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ShoppingItemService } from './shopping-item.service';
import { CreateShoppingItemDto } from './dto/create-shopping-item.dto';
import { UpdateShoppingItemDto } from './dto/update-shopping-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Shopping Items')
@Controller('shopping-item')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
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
