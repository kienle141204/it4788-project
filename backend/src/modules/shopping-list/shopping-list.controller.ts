import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ShoppingListService } from './shopping-list.service';
import { CreateShoppingListDto } from './dto/create-shopping-list.dto';
import { UpdateShoppingListDto } from './dto/update-shopping-list.dto';
import { User, Roles, Owner, JwtAuthGuard, RolesGuard, OwnerGuard, SelfOrAdminGuard } from 'src/common';

@ApiTags('Shopping Lists')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('api/shopping-lists')
export class ShoppingListController {
  constructor(private readonly shoppingListService: ShoppingListService) { }

  /** POST /shopping-lists */
  @Post()
  create(@Body() dto: CreateShoppingListDto) {
    return this.shoppingListService.create(dto);
  }

  /** GET /shopping-lists */
  @Get()
  findAll() {
    return this.shoppingListService.findAll();
  }

  /** GET /shopping-lists/:id */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.shoppingListService.findOne(id);
  }

  /** PATCH /shopping-lists/:id */
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateShoppingListDto) {
    return this.shoppingListService.update(id, dto);
  }

  /** DELETE /shopping-lists/:id */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.shoppingListService.remove(id);
  }
}
