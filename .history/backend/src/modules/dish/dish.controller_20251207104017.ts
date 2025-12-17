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
  ValidationPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { DishService } from './dish.service';
import { CreateDishDto } from './dto/create-dish.dto';
import { PaginationDto, SearchDishDto } from './dto/pagination.dto';
import { TopRatedDishesDto, TopDishesDto } from './dto/top-dishes.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../../entities/user.entity';
import { NutrientService } from '../nutrient/nutrient.service';

@ApiTags('Dishes')
@Controller('api/dishes')
export class DishController {
  constructor(
    private readonly dishService: DishService,
    private readonly nutrientService: NutrientService,
  ) {}

  @Get('get-all-info-dish')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Lấy tất cả món ăn',
    description: 'API này trả về danh sách tất cả các món ăn trong hệ thống (không phân trang).'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lấy danh sách món ăn thành công',
    example: {
      success: true,
      message: 'Lấy danh sách món ăn thành công',
      data: [
        {
          id: 1,
          name: 'Phở Bò',
          description: 'Món phở truyền thống Việt Nam',
          image_url: 'https://example.com/pho.jpg'
        }
      ]
    }
  })
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
  @ApiOperation({ 
    summary: 'Lấy danh sách món ăn có phân trang',
    description: 'API này trả về danh sách món ăn với phân trang. Có thể chỉ định số trang và số lượng món ăn mỗi trang.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Số lượng món ăn mỗi trang (mặc định: 10)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lấy danh sách món ăn thành công',
    example: {
      success: true,
      message: 'Lấy danh sách món ăn trang 1 thành công',
      data: [
        {
          id: 1,
          name: 'Phở Bò',
          description: 'Món phở truyền thống Việt Nam',
          image_url: 'https://example.com/pho.jpg'
        }
      ],
      pagination: {
        currentPage: 1,
        totalPages: 5,
        totalItems: 50,
        itemsPerPage: 10,
        hasNextPage: true,
        hasPrevPage: false
      }
    }
  })
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
  @ApiOperation({ 
    summary: 'Tìm kiếm món ăn theo tên',
    description: 'API này cho phép tìm kiếm món ăn theo tên với phân trang. Kết quả trả về các món ăn có tên chứa từ khóa tìm kiếm.'
  })
  @ApiQuery({ name: 'name', required: false, type: String, example: 'phở', description: 'Từ khóa tìm kiếm' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Số trang' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Số lượng món ăn mỗi trang' })
  @ApiResponse({ 
    status: 200, 
    description: 'Tìm kiếm thành công',
    example: {
      success: true,
      message: 'Tìm thấy 5 món ăn với từ khóa "phở"',
      data: [
        {
          id: 1,
          name: 'Phở Bò',
          description: 'Món phở truyền thống Việt Nam',
          image_url: 'https://example.com/pho.jpg'
        }
      ],
      searchTerm: 'phở',
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 5,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPrevPage: false
      }
    }
  })
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
  @ApiOperation({ 
    summary: 'Lấy thông tin món ăn theo ID',
    description: 'API này trả về thông tin chi tiết của một món ăn theo ID, bao gồm các nguyên liệu và công thức liên quan.'
  })
  @ApiParam({ name: 'id', type: 'number', example: 1, description: 'ID của món ăn' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lấy thông tin món ăn thành công',
    example: {
      success: true,
      message: 'Lấy thông tin món ăn thành công',
      data: {
        id: 1,
        name: 'Phở Bò',
        description: 'Món phở truyền thống Việt Nam',
        image_url: 'https://example.com/pho.jpg',
        ingredients: [],
        recipes: []
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy món ăn' })
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
  @ApiOperation({ 
    summary: 'Tạo món ăn mới',
    description: 'API này cho phép người dùng tạo một món ăn mới trong hệ thống. Món ăn sẽ được gán cho người dùng hiện tại.'
  })
  @ApiBody({
    type: CreateDishDto,
    examples: {
      example1: {
        summary: 'Tạo món ăn với đầy đủ thông tin',
        value: {
          name: 'Phở Bò',
          description: 'Món phở truyền thống Việt Nam với thịt bò tái',
          image_url: 'https://example.com/pho.jpg'
        }
      },
      example2: {
        summary: 'Tạo món ăn chỉ với tên',
        value: {
          name: 'Bánh Mì'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Tạo món ăn thành công',
    example: {
      success: true,
      message: 'Tạo món ăn thành công',
      data: {
        id: 1,
        name: 'Phở Bò',
        description: 'Món phở truyền thống Việt Nam với thịt bò tái',
        image_url: 'https://example.com/pho.jpg',
        created_by: 1,
        created_at: '2024-01-01T00:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  async create(@Body() createDishDto: CreateDishDto, @Request() req) {
    const user: User = req.user;
    const dish = await this.dishService.create(createDishDto, user);
    return {
      success: true,
      message: 'Tạo món ăn thành công',
      data: dish,
    };
  }

  /**
   * Lấy dinh dưỡng của một món ăn
   * GET /api/dishes/:id/nutrients
   */
  @Get(':id/nutrients')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy dinh dưỡng của một món ăn theo ID' })
  async getDishNutrients(@Param('id', ParseIntPipe) id: number) {
    const dish = await this.dishService.findOne(id);
    const nutrients = await this.nutrientService.findByDishId(id);
    return {
      success: true,
      message: 'Lấy dinh dưỡng của món ăn thành công',
      data: {
        dish: {
          id: dish.id,
          name: dish.name,
        },
        nutrients: nutrients,
      },
      total: nutrients.length,
    };
  }

  /**
   * Lấy top món ăn theo số sao trung bình của review
   * GET /api/dishes/top-rated
   */
  @Get('top-rated')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Lấy top món ăn theo số sao trung bình',
    description: 'API này trả về top món ăn (3, 10, hoặc 20) được đánh giá cao nhất trong một tháng, với điều kiện số sao trung bình >= minRating.',
  })
  @ApiQuery({ name: 'top', required: true, type: Number, example: 10, description: 'Số lượng món ăn (3, 10, hoặc 20)' })
  @ApiQuery({ name: 'minRating', required: true, type: Number, example: 4, description: 'Mốc số sao tối thiểu (1-5)' })
  @ApiQuery({ name: 'month', required: false, type: Number, example: 12, description: 'Tháng (1-12), mặc định tháng hiện tại' })
  @ApiQuery({ name: 'year', required: false, type: Number, example: 2024, description: 'Năm, mặc định năm hiện tại' })
  @ApiResponse({
    status: 200,
    description: 'Lấy top món ăn theo rating thành công',
    example: {
      success: true,
      message: 'Lấy top 10 món ăn theo rating tháng 12/2024 thành công',
      data: [
        {
          id: 1,
          name: 'Phở Bò',
          description: 'Món phở truyền thống',
          image_url: 'https://example.com/pho.jpg',
          avgRating: 4.5,
          reviewCount: 20,
        },
      ],
      filters: {
        top: 10,
        minRating: 4,
        month: 12,
        year: 2024,
      },
    },
  })
  async getTopRatedDishes(
    @Query('top', ParseIntPipe) top: number,
    @Query('minRating', ParseIntPipe) minRating: number,
    @Query('month', new DefaultValuePipe(undefined), ParseIntPipe) month?: number,
    @Query('year', new DefaultValuePipe(undefined), ParseIntPipe) year?: number,
  ) {
    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    const dto: TopRatedDishesDto = {
      top,
      minRating,
      month: targetMonth,
      year: targetYear,
    };

    const dishes = await this.dishService.getTopRatedDishes(dto);
    
    return {
      success: true,
      message: `Lấy top ${top} món ăn theo rating tháng ${targetMonth}/${targetYear} thành công`,
      data: dishes,
      filters: {
        top,
        minRating,
        month: targetMonth,
        year: targetYear,
      },
    };
  }

  /**
   * Lấy top món ăn được thêm vào menu nhiều nhất
   * GET /api/dishes/top-menu
   */
  @Get('top-menu')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Lấy top món ăn được thêm vào menu nhiều nhất',
    description: 'API này trả về top món ăn (3, 10, hoặc 20) được thêm vào menu nhiều nhất trong một tháng.',
  })
  @ApiQuery({ name: 'top', required: true, type: Number, example: 10, description: 'Số lượng món ăn (3, 10, hoặc 20)' })
  @ApiQuery({ name: 'month', required: false, type: Number, example: 12, description: 'Tháng (1-12), mặc định tháng hiện tại' })
  @ApiQuery({ name: 'year', required: false, type: Number, example: 2024, description: 'Năm, mặc định năm hiện tại' })
  @ApiResponse({
    status: 200,
    description: 'Lấy top món ăn được thêm vào menu nhiều nhất thành công',
    example: {
      success: true,
      message: 'Lấy top 10 món ăn được thêm vào menu tháng 12/2024 thành công',
      data: [
        {
          id: 1,
          name: 'Phở Bò',
          description: 'Món phở truyền thống',
          image_url: 'https://example.com/pho.jpg',
          menuCount: 15,
        },
      ],
      filters: {
        top: 10,
        month: 12,
        year: 2024,
      },
    },
  })
  async getTopMenuDishes(@Query() dto: TopDishesDto) {
    const now = new Date();
    const month = dto.month || now.getMonth() + 1;
    const year = dto.year || now.getFullYear();

    const dishes = await this.dishService.getTopMenuDishes(dto);
    
    return {
      success: true,
      message: `Lấy top ${dto.top} món ăn được thêm vào menu tháng ${month}/${year} thành công`,
      data: dishes,
      filters: {
        top: dto.top,
        month,
        year,
      },
    };
  }
}
