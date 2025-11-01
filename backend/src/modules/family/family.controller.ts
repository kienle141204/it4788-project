import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FamilyService } from './family.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { User } from '../../common/decorators/user.decorator';
import type { JwtUser } from '../../common/types/user.type';

@Controller('families')
@UseGuards(JwtAuthGuard)
export class FamilyController {
  constructor(private readonly familyService: FamilyService) { }

  /** ✅ Create family */
  @Post()
  async createFamily(@Body() dto: CreateFamilyDto, @User() user: JwtUser) {
    const ownerId = user.role === 'admin' ? (dto.owner_id ?? user.id) : user.id;

    return this.familyService.createFamily(dto.name, ownerId, user);
  }

  /** 📄 Get all families */
  @Get()
  async getAllFamilies() {
    return this.familyService.getAllFamilies();
  }

  /** 👀 Get family by ID */
  @Get(':id')
  async getFamilyById(@Param('id', ParseIntPipe) id: number) {
    return this.familyService.getFamilyById(id);
  }

  /** ✏️ Update family */
  @Put(':id')
  async updateFamily(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFamilyDto,
    @User() user: JwtUser,
  ) {
    return this.familyService.updateFamily(id, dto, user.id, user.role);
  }

  /** 🗑️ Delete family */
  @Delete(':id')
  async deleteFamily(
    @Param('id', ParseIntPipe) id: number,
    @User() user: JwtUser,
  ) {
    await this.familyService.deleteFamily(id, user.id, user.role);
    return { message: `Family ${id} deleted successfully` };
  }
}
