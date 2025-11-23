import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ShoppingStatisticsService } from './shopping-statistics.service';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { User, Roles, Owner, JwtAuthGuard, RolesGuard, OwnerGuard, SelfOrAdminGuard } from 'src/common';
import type { JwtUser } from 'src/common/types/user.type';

@Controller('api/shopping-statistics')
export class ShoppingStatisticsController {
  constructor(
    private readonly statisticsService: ShoppingStatisticsService,
  ) { }

  /** Tổng chi phí theo tháng */
  @Get('monthly-cost')
  async getTotalCostByMonth(
    @Query('year', ParseIntPipe) year: number,
    @Query('userId', ParseIntPipe) userId: number
  ) {
    return this.statisticsService.totalCostByMonth(year, userId);
  }

  /** Số lượng item đã check */
  @Get('checked-items')
  async getCheckedItems(
    @Query('userId', ParseIntPipe) userId: number
  ) {
    return this.statisticsService.countCheckedItems(userId);
  }

  /** Top nguyên liệu theo số lượng */
  @Get('top-ingredients')
  async getTopIngredients(
    @Query('userId', ParseIntPipe) userId: number,
    @Query('limit') limit: number = 5
  ) {
    return this.statisticsService.topIngredients(limit, userId);
  }

  /** Top nguyên liệu theo tổng tiền */
  @Get('top-ingredients-cost')
  async getTopIngredientsByCost(
    @Query('userId', ParseIntPipe) userId: number,
    @Query('limit') limit: number = 5,
  ) {
    return this.statisticsService.topIngredientsByCost(limit, userId);
  }

  /** Thống kê theo user */
  @Get('user/:userId')
  async getUserStatistics(
    @Param('userId', ParseIntPipe) userId: number
  ) {
    return this.statisticsService.statisticsByUser(userId);
  }

  /** Thống kê theo family */
  @Get('family/:familyId')
  async getFamilyStatistics(
    @Param('familyId', ParseIntPipe) familyId: number
  ) {
    return this.statisticsService.statisticsByFamily(familyId);
  }
}
