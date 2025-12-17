import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ShoppingStatisticsService } from './shopping-statistics.service';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { User, Roles, Owner, JwtAuthGuard, RolesGuard, OwnerGuard, SelfOrAdminGuard } from 'src/common';
import type { JwtUser } from 'src/common/types/user.type';

@ApiTags('Shopping Statistics')
@ApiBearerAuth('JWT-auth')
@Controller('api/shopping-statistics')
@UseGuards(JwtAuthGuard)
export class ShoppingStatisticsController {
  constructor(
    private readonly statisticsService: ShoppingStatisticsService,
  ) { }

  /** Tổng chi phí theo tháng */
  @Get('monthly-cost')
  @ApiOperation({ summary: 'Lấy ra toàn bộ chi phí theo từng tháng' })
  @ApiResponse({ status: 200, description: 'Total cost retrieved successfully.' })
  async getTotalCostByMonth(
    @Query('year', ParseIntPipe) year: number,
    @Query('familyId', ParseIntPipe) familyId: number,
    @User() user: JwtUser,
  ) {
    return this.statisticsService.totalCostByMonth(year, familyId, user);
  }

  /** Số lượng item đã check */
  @Get('checked-items')
  @ApiOperation({ summary: 'Lấy ra số lượng item đã được check' })
  @ApiResponse({ status: 200, description: 'Checked items count retrieved successfully.' })
  async getCheckedItems(
    @Query('familyId', ParseIntPipe) familyId: number,
    @User() user: JwtUser,
  ) {
    return this.statisticsService.countCheckedItems(familyId, user);
  }

  /** Top nguyên liệu theo số lượng */
  @Get('top-ingredients')
  @ApiOperation({ summary: 'Lấy ra top nguyên liệu được mua theo số lượng' })
  @ApiResponse({ status: 200, description: 'Top ingredients retrieved successfully.' })
  async getTopIngredients(
    @Query('familyId', ParseIntPipe) familyId: number,
    @Query('limit') limit: number = 5,
    @User() user: JwtUser,
  ) {
    return this.statisticsService.topIngredients(limit, familyId, user);
  }

  /** Top nguyên liệu theo tổng tiền */
  @Get('top-ingredients-cost')
  @ApiBearerAuth('JWT-auth')
  @ApiTags('Shopping Statistics')
  @ApiOperation({ summary: 'Lấy ra top nguyên liệu được mua theo tổng tiền' })
  @ApiResponse({ status: 200, description: 'Top ingredients by cost retrieved successfully.' })
  async getTopIngredientsByCost(
    @Query('familyId', ParseIntPipe) familyId: number,
    @Query('limit') limit: number = 5,
    @User() user: JwtUser,
  ) {
    return this.statisticsService.topIngredientsByCost(limit, familyId, user);
  }

  /** Thống kê theo user */
  @Get('user/:userId')
  @ApiBearerAuth('JWT-auth')
  @ApiTags('Shopping Statistics')
  @ApiOperation({ summary: 'Lấy ra thống kê mua sắm theo user' })
  @ApiResponse({ status: 200, description: 'User statistics retrieved successfully.' })
  async getUserStatistics(
    @Param('userId', ParseIntPipe) userId: number,
    @User() user: JwtUser,
  ) {
    return this.statisticsService.statisticsByUser(userId, user);
  }

  /** Thống kê theo family */
  @Get('family/:familyId')
  @ApiBearerAuth('JWT-auth')
  @ApiTags('Shopping Statistics')
  @ApiOperation({ summary: 'Lấy ra thống kê mua sắm theo family' })
  @ApiResponse({ status: 200, description: 'Family statistics retrieved successfully.' })
  async getFamilyStatistics(
    @Param('familyId', ParseIntPipe) familyId: number,
    @User() user: JwtUser,
  ) {
    return this.statisticsService.statisticsByFamily(familyId, user);
  }
}
