import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RefrigeratorService } from './refrigerator.service';
import { CreateRefrigeratorDto } from './dto/create-refrigerator.dto';
import { UpdateRefrigeratorDto } from './dto/update-refrigerator.dto';
import { User, Roles, Owner, JwtAuthGuard, RolesGuard, OwnerGuard, SelfOrAdminGuard } from 'src/common';

@Controller('refrigerator')
export class RefrigeratorController {
  constructor(private readonly refrigeratorService: RefrigeratorService) { }

  @Post()
  create(@Body() createRefrigeratorDto: CreateRefrigeratorDto) {
    return this.refrigeratorService.create(createRefrigeratorDto);
  }

  @Get()
  findAll() {
    return this.refrigeratorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.refrigeratorService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRefrigeratorDto: UpdateRefrigeratorDto) {
    return this.refrigeratorService.update(+id, updateRefrigeratorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.refrigeratorService.remove(+id);
  }
}
