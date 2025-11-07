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
import { MenuService } from './menu.service';
import { CreateMenuDto, CreateMenuDishDto, UpdateMenuDishDto, GetMenusDto } from './dto/menu.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('menus')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  /**
   * Lấy danh sách menu với phân trang
   * GET /menus?page=1&limit=10&familyId=1
   */
  @Get()
  async findAll(@Query() getMenusDto: GetMenusDto) {
    const result = await this.menuService.findAllWithPagination(getMenusDto);
    
    let message = `Lấy danh sách menu trang ${result.page} thành công`;
    if (getMenusDto.familyId) {
      message += ` của gia đình ID ${getMenusDto.familyId}`;
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
   * Lấy menu theo ID
   * GET /menus/:id
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const menu = await this.menuService.findOne(id);
    return {
      success: true,
      message: 'Lấy thông tin menu thành công',
      data: menu,
    };
  }

  /**
   * Tạo menu mới
   * POST /menus?familyId=1
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createMenu(
    @Query('familyId', ParseIntPipe) familyId: number,
    @Body() createMenuDto: CreateMenuDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const menu = await this.menuService.createMenu(createMenuDto, familyId, userId);
    
    return {
      success: true,
      message: 'Tạo menu thành công',
      data: menu,
    };
  }

  /**
   * Thêm món ăn vào menu
   * POST /menus/:menuId/dishes
   */
  @Post(':menuId/dishes')
  @UseGuards(JwtAuthGuard)
  async addDishToMenu(
    @Param('menuId', ParseIntPipe) menuId: number,
    @Body() createMenuDishDto: CreateMenuDishDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const menuDish = await this.menuService.addDishToMenu(menuId, createMenuDishDto, userId);
    
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
  @UseGuards(JwtAuthGuard)
  async updateMenuDish(
    @Param('menuDishId', ParseIntPipe) menuDishId: number,
    @Body() updateMenuDishDto: UpdateMenuDishDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const menuDish = await this.menuService.updateMenuDish(menuDishId, updateMenuDishDto, userId);
    
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
  @UseGuards(JwtAuthGuard)
  async removeDishFromMenu(
    @Param('menuDishId', ParseIntPipe) menuDishId: number,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    await this.menuService.removeDishFromMenu(menuDishId, userId);
    
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
  @UseGuards(JwtAuthGuard)
  async deleteMenu(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    await this.menuService.deleteMenu(id, userId);
    
    return {
      success: true,
      message: 'Xóa menu thành công',
    };
  }
}


