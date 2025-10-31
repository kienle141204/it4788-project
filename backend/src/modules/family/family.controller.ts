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
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FamilyService } from './family.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';

@Controller('families')
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  /** ✅ Create new family */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createFamily(@Body() dto: CreateFamilyDto, @Req() req) {
    const userId = req.user.id;
    const role = req.user.role;

    const ownerId = role === 'admin' ? (dto.owner_id ?? userId) : userId;

    return this.familyService.createFamily(dto.name, ownerId);
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
  @UseGuards(JwtAuthGuard)
  async updateFamily(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFamilyDto,
    @Req() req,
  ) {
    return this.familyService.updateFamily(id, dto, req.user.id, req.user.role);
  }

  /** 🗑️ Delete family */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteFamily(@Param('id', ParseIntPipe) id: number, @Req() req) {
    await this.familyService.deleteFamily(id, req.user.id, req.user.role);
    return { message: `Family ${id} deleted successfully` };
  }
}
