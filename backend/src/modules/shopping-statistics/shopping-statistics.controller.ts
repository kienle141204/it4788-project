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
@UseGuards(JwtAuthGuard)
@Controller('api/shopping-statistics')
export class ShoppingStatisticsController {
  constructor(
    private readonly statisticsService: ShoppingStatisticsService,
  ) { }

  /** Tổng chi phí theo tháng */
  @Get('monthly-cost')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy ra toàn bộ chi phí theo từng tháng' })
  @ApiResponse({
    status: 200,
    description: 'Total cost retrieved successfully.',
    schema: {
      example: [
        {
          month: "2024-01",
          total_cost: 1500000,
          shopping_lists: [
            {
              id: 1,
              cost: 500000,
              shopping_date: "2024-01-15T00:00:00.000Z",
              items: [
                {
                  id: 1,
                  name: "Thịt bò",
                  ingredient: { id: 1, name: "Thịt bò", image_url: "..." }
                }
              ]
            }
          ]
        }
      ]
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTotalCostByMonth(
    @Query('year', ParseIntPipe) year: number,
    @Query('familyId', ParseIntPipe) familyId: number,
    @User() user: JwtUser,
  ) {
    return this.statisticsService.totalCostByMonth(year, familyId, user);
  }

  /** Số lượng item đã check */
  @Get('checked-items')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy ra số lượng item đã được check' })
  @ApiResponse({
    status: 200,
    description: 'Checked items count retrieved successfully.',
    schema: {
      example: {
        total: 5,
        items: [
          {
            id: 1,
            name: "Rau cải",
            is_checked: true,
            ingredient: { id: 2, name: "Rau cải" }
          }
        ]
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCheckedItems(
    @Query('familyId', ParseIntPipe) familyId: number,
    @User() user: JwtUser,
  ) {
    return this.statisticsService.countCheckedItems(familyId, user);
  }

  /** Top nguyên liệu theo số lượng */
  @Get('top-ingredients')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy ra top nguyên liệu được mua theo số lượng' })
  @ApiResponse({ status: 200, description: 'Top ingredients retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Lấy ra top nguyên liệu được mua theo tổng tiền' })
  @ApiResponse({ status: 200, description: 'Top ingredients by cost retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Lấy ra thống kê mua sắm theo user' })
  @ApiResponse({
    status: 200,
    description: 'User statistics retrieved successfully.',
    schema: {
      example: {
        total_cost: 2000000,
        purchased_items: [
          {
            id: 10,
            name: "Sữa tươi",
            price: 30000,
            is_checked: true,
            ingredient: { id: 5, name: "Sữa tươi" }
          }
        ]
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserStatistics(
    @Param('userId', ParseIntPipe) userId: number,
    @User() user: JwtUser,
  ) {
    return this.statisticsService.statisticsByUser(userId, user);
  }

  /** Thống kê theo family */
  @Get('family/:familyId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy ra thống kê mua sắm theo family' })
  @ApiResponse({
    status: 200,
    description: 'Family statistics retrieved successfully.',
    schema: {
      example: {
        total_cost: 5000000,
        purchased_items: [
          {
            id: 15,
            name: "Gạo",
            price: 200000,
            is_checked: true,
            ingredient: { id: 8, name: "Gạo" }
          }
        ]
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFamilyStatistics(
    @Param('familyId', ParseIntPipe) familyId: number,
    @User() user: JwtUser,
  ) {
    return this.statisticsService.statisticsByFamily(familyId, user);
  }
}
