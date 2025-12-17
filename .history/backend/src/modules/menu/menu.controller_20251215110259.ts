import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { CreateMenuDto, UpdateMenuDto, CreateMenuDishDto, UpdateMenuDishDto, GetMenusDto, GetMenuDishesByDateDto } from './dto/menu.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { buildSuccessResponse, ResponseCode } from 'src/common/errors/error-codes';

@ApiTags('Menus')
@Controller('api/menus')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  /**
   * Lấy danh sách menu với phân trang
   * GET /api/menus?page=1&limit=10&familyId=1
   */
  @Get()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async findAll(@Query() getMenusDto: GetMenusDto, @Request() req: any) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const result = await this.menuService.findAllWithPagination(getMenusDto, userId, userRole);
    
    let message = `Lấy danh sách menu trang ${result.page} thành công`;
    if (getMenusDto.familyId) {
      message += ` của gia đình ID ${getMenusDto.familyId}`;
    }
    if (getMenusDto.time) {
      const timeLabels: Record<string, string> = {
        breakfast: 'Bữa sáng',
        morning_snack: 'Bữa phụ sáng',
        lunch: 'Bữa trưa',
        afternoon_snack: 'Bữa phụ chiều',
        dinner: 'Bữa tối',
        late_night: 'Bữa khuya',
      };
      message += ` - ${timeLabels[getMenusDto.time] || getMenusDto.time}`;
    }

    return buildSuccessResponse(ResponseCode.C00132, result.data, {
      pagination: {
        currentPage: result.page,
        totalPages: result.totalPages,
        totalItems: result.total,
        itemsPerPage: result.limit,
        hasNextPage: result.page < result.totalPages,
        hasPrevPage: result.page > 1,
      },
    });
  }

  /**
   * Lấy danh sách menu dishes theo ngày
   * GET /menus/dishes/by-date?date=2024-01-20
   */
  @Get('dishes/by-date')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
// <<<<<<< frontend/market
//   @ApiOperation({ 
//     summary: 'Lấy món ăn trong menu theo ngày',
//     description: 'API này trả về danh sách món ăn trong menu của một ngày cụ thể.'
//   })
//   @ApiQuery({ name: 'date', required: false, type: String, example: '2024-01-20', description: 'Ngày cần lấy menu (format: YYYY-MM-DD)' })
//   @ApiQuery({ name: 'familyId', required: false, type: Number, example: 1, description: 'ID của gia đình' })
//   @ApiResponse({ 
//     status: 200, 
//     description: 'Lấy danh sách món ăn thành công',
//     example: {
//       success: true,
//       message: 'Lấy danh sách món ăn trong menu thành công cho ngày 2024-01-20',
//       data: [],
//       total: 0
//     }
//   })
// =======
// >>>>>>> main
  async getMenuDishesByDate(
    @Query() getMenuDishesByDateDto: GetMenuDishesByDateDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const dishes = await this.menuService.getMenuDishesByDate(getMenuDishesByDateDto, userId, userRole);
    
    let message = 'Lấy danh sách món ăn trong menu thành công';
    if (getMenuDishesByDateDto.date) {
      message += ` cho ngày ${getMenuDishesByDateDto.date}`;
    }

    return buildSuccessResponse(ResponseCode.C00132, dishes, { total: dishes.length });
  }

  /**
   * Tính tổng tiền bữa ăn
   * GET /menus/:menuId/total
   */
  @Get(':menuId/total')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
// <<<<<<< frontend/market
//   @ApiOperation({ 
//     summary: 'Tính tổng tiền menu',
//     description: 'API này tính tổng tiền của tất cả các món ăn trong menu.'
//   })
//   @ApiParam({ name: 'menuId', type: 'number', example: 1, description: 'ID của menu' })
//   @ApiResponse({ 
//     status: 200, 
//     description: 'Tính tổng tiền thành công',
//     example: {
//       success: true,
//       message: 'Tính tổng tiền menu ID 1 thành công',
//       data: {
//         total: 500000,
//         currency: 'VND'
//       }
//     }
//   })
// =======
// >>>>>>> main
  async calculateMenuTotal(
    @Param('menuId', ParseIntPipe) menuId: number,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const result = await this.menuService.calculateMenuTotal(menuId, userId, userRole);
    return buildSuccessResponse(ResponseCode.C00133, result);
  }

  /**
   * Lấy menu theo ID
   * GET /menus/:id
   */
  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
// <<<<<<< frontend/market
//   @ApiOperation({ 
//     summary: 'Lấy menu theo ID',
//     description: 'API này trả về thông tin chi tiết của một menu theo ID.'
//   })
//   @ApiParam({ name: 'id', type: 'number', example: 1, description: 'ID của menu' })
//   @ApiResponse({ 
//     status: 200, 
//     description: 'Lấy thông tin menu thành công',
//     example: {
//       success: true,
//       message: 'Lấy thông tin menu thành công',
//       data: {
//         id: 1,
//         family_id: 1,
//         date: '2024-01-01',
//         meal_type: 'breakfast'
//       }
//     }
//   })
//   @ApiResponse({ status: 404, description: 'Không tìm thấy menu' })
// =======
// >>>>>>> main
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const menu = await this.menuService.findOne(id, userId, userRole);
    return buildSuccessResponse(ResponseCode.C00133, menu);
  }

  /**
   * Tạo menu mới
   * POST /api/menus?familyId=1
   */
  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async createMenu(
    @Query('familyId', ParseIntPipe) familyId: number,
    @Body() createMenuDto: CreateMenuDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const menu = await this.menuService.createMenu(createMenuDto, familyId, userId, userRole);
    
    return buildSuccessResponse(ResponseCode.C00131, menu);
  }

  /**
   * Cập nhật menu
   * PUT /api/menus/:id
   */
  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async updateMenu(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMenuDto: UpdateMenuDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const menu = await this.menuService.updateMenu(id, updateMenuDto, userId, userRole);
    
    return buildSuccessResponse(ResponseCode.C00135, menu);
  }

  /**
   * Thêm món ăn vào menu
   * POST /api/menus/:menuId/dishes
   */
  @Post(':menuId/dishes')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Thêm món ăn vào menu',
    description: 'API này cho phép thêm một món ăn vào menu với số lượng và giá cụ thể.'
  })
  @ApiParam({ name: 'menuId', type: 'number', example: 1, description: 'ID của menu' })
  @ApiBody({
    type: CreateMenuDishDto,
    examples: {
      example1: {
        summary: 'Thêm món ăn vào menu',
        value: {
          dish_id: 1,
          quantity: 2,
          price: 50000
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Thêm món ăn vào menu thành công',
    example: {
      success: true,
      message: 'Thêm món ăn vào menu thành công',
      data: {
        id: 1,
        menu_id: 1,
        dish_id: 1,
        quantity: 2,
        price: 50000
      }
    }
  })
  async addDishToMenu(
    @Param('menuId', ParseIntPipe) menuId: number,
    @Body() createMenuDishDto: CreateMenuDishDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const menuDish = await this.menuService.addDishToMenu(menuId, createMenuDishDto, userId, userRole);
    
    return buildSuccessResponse(ResponseCode.C00134, menuDish);
  }

  /**
   * Cập nhật món ăn trong menu
   * PUT /menus/dishes/:menuDishId
   */
  @Put('dishes/:menuDishId')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Cập nhật món ăn trong menu',
    description: 'API này cho phép cập nhật thông tin món ăn trong menu như số lượng hoặc giá.'
  })
  @ApiParam({ name: 'menuDishId', type: 'number', example: 1, description: 'ID của menu dish' })
  @ApiBody({
    type: UpdateMenuDishDto,
    examples: {
      example1: {
        summary: 'Cập nhật món ăn',
        value: {
          quantity: 3,
          price: 60000
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cập nhật món ăn thành công',
    example: {
      success: true,
      message: 'Cập nhật món ăn trong menu thành công',
      data: {
        id: 1,
        quantity: 3,
        price: 60000
      }
    }
  })
  async updateMenuDish(
    @Param('menuDishId', ParseIntPipe) menuDishId: number,
    @Body() updateMenuDishDto: UpdateMenuDishDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const menuDish = await this.menuService.updateMenuDish(menuDishId, updateMenuDishDto, userId, userRole);
    
    return buildSuccessResponse(ResponseCode.C00135, menuDish);
  }

  /**
   * Xóa món ăn khỏi menu
   * DELETE /menus/dishes/:menuDishId
   */
  @Delete('dishes/:menuDishId')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Xóa món ăn khỏi menu',
    description: 'API này cho phép xóa một món ăn khỏi menu.'
  })
  @ApiParam({ name: 'menuDishId', type: 'number', example: 1, description: 'ID của menu dish' })
  @ApiResponse({ 
    status: 200, 
    description: 'Xóa món ăn thành công',
    example: {
      success: true,
      message: 'Xóa món ăn khỏi menu thành công'
    }
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy menu dish' })
  async removeDishFromMenu(
    @Param('menuDishId', ParseIntPipe) menuDishId: number,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    await this.menuService.removeDishFromMenu(menuDishId, userId, userRole);
    
    return buildSuccessResponse(ResponseCode.C00136, { menuDishId });
  }

  /**
   * Xóa menu
   * DELETE /menus/:id
   */
  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Xóa menu',
    description: 'API này cho phép xóa một menu. Lưu ý: Tất cả các món ăn trong menu cũng sẽ bị xóa.'
  })
  @ApiParam({ name: 'id', type: 'number', example: 1, description: 'ID của menu' })
  @ApiResponse({ 
    status: 200, 
    description: 'Xóa menu thành công',
    example: {
      success: true,
      message: 'Xóa menu thành công'
    }
  })
  @ApiResponse({ status: 403, description: 'Không có quyền xóa menu này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy menu' })
  async deleteMenu(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    await this.menuService.deleteMenu(id, userId, userRole);
    
    return buildSuccessResponse(ResponseCode.C00137, { menuId: id });
  }
}


