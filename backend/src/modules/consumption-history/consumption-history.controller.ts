import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards
} from '@nestjs/common';
import { ConsumptionHistoryService } from './consumption-history.service';
import { CreateConsumptionHistoryDto } from './dto/create-consumption-history.dto';
import { UpdateConsumptionHistoryDto } from './dto/update-consumption-history.dto';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { User, Roles, Owner, JwtAuthGuard, RolesGuard, OwnerGuard, SelfOrAdminGuard } from 'src/common';
import type { JwtUser } from 'src/common/types/user.type';

@Controller('api/consumption-history')
@UseGuards(JwtAuthGuard)
export class ConsumptionHistoryController {
  constructor(private readonly consumptionService: ConsumptionHistoryService) { }

  @Post()
  @ApiBearerAuth()
  @ApiTags('Consumption History')
  @ApiOperation({ summary: 'Tạo mới bản ghi lịch sử tiêu thụ' })
  @ApiResponse({ status: 201, description: 'Consumption history created successfully.' })
  create(@Body() dto: CreateConsumptionHistoryDto) {
    return this.consumptionService.create(dto);
  }

  @Get()
  @ApiBearerAuth()
  @ApiTags('Consumption History')
  @ApiOperation({ summary: 'Lấy ra toàn bộ lịch sử tiêu thụ' })
  @ApiResponse({ status: 200, description: 'Consumption histories retrieved successfully.' })
  findAll() {
    return this.consumptionService.findAll();
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiTags('Consumption History')
  @ApiOperation({ summary: 'Lấy ra bản ghi lịch sử tiêu thụ theo ID' })
  @ApiResponse({ status: 200, description: 'Consumption history retrieved successfully.' })
  findOne(@Param('id') id: string) {
    return this.consumptionService.findOne(Number(id));
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiTags('Consumption History')
  @ApiOperation({ summary: 'Cập nhật bản ghi lịch sử tiêu thụ theo ID' })
  @ApiResponse({ status: 200, description: 'Consumption history updated successfully.' })
  update(@Param('id') id: string, @Body() dto: UpdateConsumptionHistoryDto) {
    return this.consumptionService.update(Number(id), dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiTags('Consumption History')
  @ApiOperation({ summary: 'Xóa bản ghi lịch sử tiêu thụ theo ID' })
  @ApiResponse({ status: 200, description: 'Consumption history deleted successfully.' })
  remove(@Param('id') id: string) {
    return this.consumptionService.remove(Number(id));
  }
  /** Ghi log tiêu thụ */
  @Post('log')
  @ApiBearerAuth()
  @ApiTags('Consumption History')
  @ApiOperation({ summary: 'Ghi log tiêu thụ nguyên liệu/món ăn' })
  @ApiResponse({ status: 201, description: 'Consumption logged successfully.' })
  logConsumption(@Body() body: { user_id: number; family_id?: number; consume_type: 'dish' | 'ingredient'; stock: number }) {
    return this.consumptionService.logConsumption(body);
  }

  /** Thống kê theo tháng */
  @Get('statistics/monthly')
  @ApiBearerAuth()
  @ApiTags('Consumption History')
  @ApiOperation({ summary: 'Lấy ra thống kê tiêu thụ theo tháng trong năm' })
  @ApiResponse({ status: 200, description: 'Monthly statistics retrieved successfully.' })
  monthlyStatistics(@Query('year') year: number, @Query('userId') userId: number) {
    return this.consumptionService.monthlyStatistics(+year, +userId);
  }

  /** Top nguyên liệu/món tiêu thụ */
  @Get('statistics/top')
  @ApiBearerAuth()
  @ApiTags('Consumption History')
  @ApiOperation({ summary: 'Lấy ra top nguyên liệu/món ăn được tiêu thụ nhiều nhất' })
  @ApiResponse({ status: 200, description: 'Top consumed items retrieved successfully.' })
  topConsumed(@Query('type') type: 'dish' | 'ingredient', @Query('limit') limit?: number, @Query('userId') userId?: number) {
    return this.consumptionService.topConsumed(type, limit ? +limit : 5, userId ? +userId : undefined);
  }

  /** Thống kê theo user */
  @Get('statistics/user/:userId')
  @ApiBearerAuth()
  @ApiTags('Consumption History')
  @ApiOperation({ summary: 'Lấy ra thống kê tiêu thụ theo user' })
  @ApiResponse({ status: 200, description: 'User statistics retrieved successfully.' })
  statisticsByUser(@Param('userId') userId: number) {
    return this.consumptionService.statisticsByUser(+userId);
  }

  /** Thống kê theo family */
  @Get('statistics/family/:familyId')
  @ApiBearerAuth()
  @ApiTags('Consumption History')
  @ApiOperation({ summary: 'Lấy ra thống kê tiêu thụ theo family' })
  @ApiResponse({ status: 200, description: 'Family statistics retrieved successfully.' })
  statisticsByFamily(@Param('familyId') familyId: number) {
    return this.consumptionService.statisticsByFamily(+familyId);
  }
}
