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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { CreateMenuDto, UpdateMenuDto, CreateMenuDishDto, UpdateMenuDishDto, GetMenusDto, GetMenuDishesByDateDto } from './dto/menu.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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

    return {
      success: true,
      message,
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
   * Lấy danh sách menu dishes theo ngày
   * GET /menus/dishes/by-date?date=2024-01-20
   */
  @Get('dishes/by-date')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
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

    return {
      success: true,
      message,
      data: dishes,
      total: dishes.length,
    };
  }

  /**
   * Tính tổng tiền bữa ăn
   * GET /menus/:menuId/total
   */
  @Get(':menuId/total')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async calculateMenuTotal(
    @Param('menuId', ParseIntPipe) menuId: number,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const result = await this.menuService.calculateMenuTotal(menuId, userId, userRole);
    return {
      success: true,
      message: `Tính tổng tiền menu ID ${menuId} thành công`,
      data: result,
    };
  }

  /**
   * Lấy menu theo ID
   * GET /menus/:id
   */
  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const menu = await this.menuService.findOne(id, userId, userRole);
    return {
      success: true,
      message: 'Lấy thông tin menu thành công',
      data: menu,
    };
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
    
    return {
      success: true,
      message: 'Tạo menu thành công',
      data: menu,
    };
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
    
    return {
      success: true,
      message: 'Cập nhật menu thành công',
      data: menu,
    };
  }

  /**
   * Thêm món ăn vào menu
   * POST /api/menus/:menuId/dishes
   */
  @Post(':menuId/dishes')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async addDishToMenu(
    @Param('menuId', ParseIntPipe) menuId: number,
    @Body() createMenuDishDto: CreateMenuDishDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const menuDish = await this.menuService.addDishToMenu(menuId, createMenuDishDto, userId, userRole);
    
    return {
      success: true,
      message: 'Thêm món ăn vào menu thành công',
      data: menuDish,
    };
  }

  /**
   * Cập nhật món ăn trong menu
   * PUT /menus/dishes/:menuDishId
   */
  @Put('dishes/:menuDishId')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async updateMenuDish(
    @Param('menuDishId', ParseIntPipe) menuDishId: number,
    @Body() updateMenuDishDto: UpdateMenuDishDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const menuDish = await this.menuService.updateMenuDish(menuDishId, updateMenuDishDto, userId, userRole);
    
    return {
      success: true,
      message: 'Cập nhật món ăn trong menu thành công',
      data: menuDish,
    };
  }

  /**
   * Xóa món ăn khỏi menu
   * DELETE /menus/dishes/:menuDishId
   */
  @Delete('dishes/:menuDishId')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async removeDishFromMenu(
    @Param('menuDishId', ParseIntPipe) menuDishId: number,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    await this.menuService.removeDishFromMenu(menuDishId, userId, userRole);
    
    return {
      success: true,
      message: 'Xóa món ăn khỏi menu thành công',
    };
  }

  /**
   * Xóa menu
   * DELETE /menus/:id
   */
  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async deleteMenu(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    await this.menuService.deleteMenu(id, userId, userRole);
    
    return {
      success: true,
      message: 'Xóa menu thành công',
    };
  }
}


