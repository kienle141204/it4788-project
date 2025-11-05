import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DishService } from './dish.service';
import { CreateDishDto } from './dto/create-dish.dto';
import { PaginationDto, SearchDishDto } from './dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../../entities/user.entity';

@ApiTags('Dishes')
@Controller('api/dishes')
export class DishController {
  constructor(private readonly dishService: DishService) {}

  @Get('get-all-info-dish')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async findAll() {
    const dishes = await this.dishService.findAll();
    return {
      success: true,
      message: 'Lấy danh sách món ăn thành công',
      data: dishes,
    };
  }

  @Get('get-paginated')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async findAllWithPagination(@Query() paginationDto: PaginationDto) {
    const result = await this.dishService.findAllWithPagination(paginationDto);
    return {
      success: true,
      message: `Lấy danh sách món ăn trang ${result.page} thành công`,
      data: result.data,
      pagination: {
        currentPage: result.page,
        totalPages: result.totalPages,
        totalItems: result.total,
        itemsPerPage: result.limit,
        hasNextPage: result.page < result.totalPages,
        hasPrevPage: result.page > 1,
      },
    };
  }

  @Get('search-paginated')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async searchByNameWithPagination(@Query() searchDto: SearchDishDto) {
    const result = await this.dishService.searchByNameWithPagination(searchDto);
    
    const message = result.searchTerm 
      ? `Tìm thấy ${result.total} món ăn với từ khóa "${result.searchTerm}"`
      : `Lấy danh sách món ăn trang ${result.page}`;

    return {
      success: true,
      message,
      data: result.data,
      searchTerm: result.searchTerm,
      pagination: {
        currentPage: result.page,
        totalPages: result.totalPages,
        totalItems: result.total,
        itemsPerPage: result.limit,
        hasNextPage: result.page < result.totalPages,
        hasPrevPage: result.page > 1,
      },
    };
  }

  @Get('get-info-dish-by-id/:id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const dish = await this.dishService.findOne(id);
    return {
      success: true,
      message: 'Lấy thông tin món ăn thành công',
      data: dish,
    };
  }

  @Post('create-dish')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async create(@Body() createDishDto: CreateDishDto, @Request() req) {
    const user: User = req.user;
    const dish = await this.dishService.create(createDishDto, user);
    return {
      success: true,
      message: 'Tạo món ăn thành công',
      data: dish,
    };
  }
}
