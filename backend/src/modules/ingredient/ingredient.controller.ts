import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { IngredientService } from './ingredient.service';
import { 
  PaginationDto, 
  SearchByNameDto, 
  SearchByPlaceDto, 
  SearchByCategoryDto,
  SearchIngredientDto 
} from './dto/search-ingredient.dto';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Ingredients')
@Controller('api/ingredients')
export class IngredientController {
  constructor(private readonly ingredientService: IngredientService) {}

  /**
   * Tạo nguyên liệu mới
   * POST /api/ingredients
   * Cần authentication
   */
  @Post()
  @Public()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async create(@Body(ValidationPipe) createIngredientDto: CreateIngredientDto) {
    const ingredient = await this.ingredientService.create(createIngredientDto);
    return {
      success: true,
      message: 'Tạo nguyên liệu thành công',
      data: ingredient,
    };
  }

  /**
   * Lấy tất cả nguyên liệu (không phân trang)
   * GET /api/ingredients
   */
  @Get()
  @Public()
  @UseGuards(JwtAuthGuard)
  async findAll() {
    const ingredients = await this.ingredientService.findAll();
    return {
      success: true,
      message: 'Lấy danh sách nguyên liệu thành công',
      data: ingredients,
    };
  }

  /**
   * Lấy nguyên liệu với phân trang
   * GET /api/ingredients/paginated?page=1&limit=10
   */
  @Get('paginated')
  @Public()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Lấy nguyên liệu với phân trang',
    description: 'API này trả về danh sách nguyên liệu với phân trang.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Số lượng nguyên liệu mỗi trang (mặc định: 10)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lấy danh sách nguyên liệu thành công',
    example: {
      success: true,
      message: 'Lấy danh sách nguyên liệu trang 1 thành công',
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPrevPage: false
      }
    }
  })
  async findAllWithPagination(@Query() paginationDto: PaginationDto) {
    const result = await this.ingredientService.findAllWithPagination(paginationDto);
    return {
      success: true,
      message: `Lấy danh sách nguyên liệu trang ${result.page} thành công`,
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

  /**
   * Lấy nguyên liệu theo danh sách ID
   * GET /api/ingredients/by-ids?ids=1,2,3
   * Cần authentication
   */
  @Get('by-ids')
  @Public()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Lấy nguyên liệu theo danh sách ID',
    description: 'API này trả về danh sách nguyên liệu theo danh sách ID được cung cấp.'
  })
  @ApiQuery({ name: 'ids', required: true, type: String, example: '1,2,3', description: 'Danh sách ID nguyên liệu, phân cách bằng dấu phẩy' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lấy danh sách nguyên liệu thành công',
    example: {
      success: true,
      message: 'Lấy danh sách nguyên liệu theo ID thành công',
      data: []
    }
  })
  async findByIds(@Query('ids') ids: string) {
    const idArray = ids.split(',').map(id => parseInt(id.trim()));
    const ingredients = await this.ingredientService.findByIds(idArray);
    return {
      success: true,
      message: 'Lấy danh sách nguyên liệu theo ID thành công',
      data: ingredients,
    };
  }

  /**
   * Tìm kiếm nguyên liệu theo tên với phân trang
   * GET /api/ingredients/search/name?name=thịt&page=1&limit=10
   * Cần authentication
   */
  @Get('search/name')
  @Public()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Tìm kiếm nguyên liệu theo tên',
    description: 'API này cho phép tìm kiếm nguyên liệu theo tên với phân trang.'
  })
  @ApiQuery({ name: 'name', required: false, type: String, example: 'thịt', description: 'Từ khóa tìm kiếm' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ 
    status: 200, 
    description: 'Tìm kiếm thành công',
    example: {
      success: true,
      message: 'Tìm thấy 5 nguyên liệu với từ khóa "thịt"',
      data: [],
      searchTerm: 'thịt',
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
  async searchByName(@Query() searchDto: SearchByNameDto) {
    const result = await this.ingredientService.searchByName(searchDto);
    
    const message = result.searchTerm 
      ? `Tìm thấy ${result.total} nguyên liệu với từ khóa "${result.searchTerm}"`
      : `Lấy danh sách nguyên liệu trang ${result.page}`;

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

  /**
   * Tìm kiếm nguyên liệu theo địa chỉ với phân trang
   * GET /api/ingredients/search/place?place_id=1&page=1&limit=10
   * Cần authentication
   */
  @Get('search/place')
  @Public()
  @UseGuards(JwtAuthGuard)
  async searchByPlace(@Query() searchDto: SearchByPlaceDto) {
    const result = await this.ingredientService.searchByPlace(searchDto);
    
    const message = result.placeId 
      ? `Tìm thấy ${result.total} nguyên liệu tại địa chỉ ID ${result.placeId}`
      : `Lấy danh sách nguyên liệu trang ${result.page}`;

    return {
      success: true,
      message,
      data: result.data,
      placeId: result.placeId,
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

  /**
   * Tìm kiếm nguyên liệu theo danh mục với phân trang
   * POST /api/ingredients/search/category
   * Cần authentication
   */
  @Post('search/category')
  @Public()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Tìm kiếm nguyên liệu theo danh mục',
    description: 'API này cho phép tìm kiếm nguyên liệu theo danh mục (category) với phân trang. Người dùng có thể tìm kiếm nguyên liệu trong một danh mục cụ thể hoặc lấy tất cả nguyên liệu với phân trang.'
  })
  @ApiBody({
    type: SearchByCategoryDto,
    examples: {
      example1: {
        summary: 'Tìm kiếm theo danh mục cụ thể',
        value: {
          category_id: 1,
          page: 1,
          limit: 10
        }
      },
      example2: {
        summary: 'Lấy tất cả nguyên liệu với phân trang (không có category_id)',
        value: {
          page: 1,
          limit: 20
        }
      },
      example3: {
        summary: 'Tìm kiếm với các tham số mặc định',
        value: {
          category_id: 2
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Tìm kiếm thành công',
    example: {
      success: true,
      message: 'Tìm thấy 15 nguyên liệu trong danh mục ID 1',
      data: [],
      categoryId: 1,
      pagination: {
        currentPage: 1,
        totalPages: 2,
        totalItems: 15,
        itemsPerPage: 10,
        hasNextPage: true,
        hasPrevPage: false
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ (category_id không phải số, page/limit không hợp lệ)' })
  async searchByCategory(@Body(ValidationPipe) searchDto: SearchByCategoryDto) {
    const result = await this.ingredientService.searchByCategory(searchDto);
    
    const message = result.categoryId 
      ? `Tìm thấy ${result.total} nguyên liệu trong danh mục ID ${result.categoryId}`
      : `Lấy danh sách nguyên liệu trang ${result.page}`;

    return {
      success: true,
      message,
      data: result.data,
      categoryId: result.categoryId,
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

  /**
   * Tìm kiếm nguyên liệu với nhiều bộ lọc
   * GET /api/ingredients/search?name=thịt&place_id=1&category_id=2&page=1&limit=10
   */
  @Get('search')
  @Public()
  @UseGuards(JwtAuthGuard)
  async searchWithFilters(@Query() searchDto: SearchIngredientDto) {
    const result = await this.ingredientService.searchWithFilters(searchDto);
    
    let message = 'Lấy danh sách nguyên liệu';
    if (result.filters.name || result.filters.place_id || result.filters.category_id) {
      message = `Tìm thấy ${result.total} nguyên liệu`;
      const filters: string[] = [];
      if (result.filters.name) filters.push(`tên: "${result.filters.name}"`);
      if (result.filters.place_id) filters.push(`địa chỉ: ${result.filters.place_id}`);
      if (result.filters.category_id) filters.push(`danh mục: ${result.filters.category_id}`);
      if (filters.length > 0) message += ` với ${filters.join(', ')}`;
    } else {
      message += ` trang ${result.page}`;
    }

    return {
      success: true,
      message,
      data: result.data,
      filters: result.filters,
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

  /**
   * Lấy danh sách nguyên liệu theo dish_id
   * GET /api/ingredients/by-dish/:dishId
   * Cần authentication
   */
  @Get('by-dish/:dishId')
  @Public()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Lấy nguyên liệu theo dish ID',
    description: 'API này trả về danh sách nguyên liệu của một món ăn cụ thể.'
  })
  @ApiParam({ name: 'dishId', type: 'number', example: 1, description: 'ID của món ăn' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lấy danh sách nguyên liệu thành công',
    example: {
      success: true,
      message: 'Lấy danh sách nguyên liệu của món ăn ID 1 thành công',
      data: [],
      total: 0
    }
  })
  async findByDishId(@Param('dishId', ParseIntPipe) dishId: number) {
    const ingredients = await this.ingredientService.findIngredientsWithDetailsByDishId(dishId);
    return {
      success: true,
      message: `Lấy danh sách nguyên liệu của món ăn ID ${dishId} thành công`,
      data: ingredients,
      total: ingredients.length,
    };
  }

  /**
   * Lấy nguyên liệu theo ID (phải đặt cuối cùng để tránh conflict với các route khác)
   * GET /api/ingredients/:id
   */
  @Get(':id')
  @Public()
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const ingredient = await this.ingredientService.findOne(id);
    return {
      success: true,
      message: 'Lấy thông tin nguyên liệu thành công',
      data: ingredient,
    };
  }
}
