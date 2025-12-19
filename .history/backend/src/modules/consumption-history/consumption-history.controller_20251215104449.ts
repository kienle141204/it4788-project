import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ConsumptionHistoryService } from './consumption-history.service';
import { CreateConsumptionHistoryDto } from './dto/create-consumption-history.dto';
import { UpdateConsumptionHistoryDto } from './dto/update-consumption-history.dto';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard, User } from 'src/common';
import type { JwtUser } from 'src/common/types/user.type';
import { buildSuccessResponse, ResponseCode } from 'src/common/errors/error-codes';

@Controller('api/consumption-history')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Consumption History')
export class ConsumptionHistoryController {
  constructor(private readonly consumptionService: ConsumptionHistoryService) { }

  @Post()
  @ApiOperation({ summary: 'Tạo mới bản ghi lịch sử tiêu thụ' })
  @ApiResponse({ status: 201, description: 'Consumption history created successfully.' })
  async create(@Body() dto: CreateConsumptionHistoryDto, @User() user: JwtUser) {
    const data = await this.consumptionService.create(dto, user);
    return buildSuccessResponse(ResponseCode.C00175, data);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy ra toàn bộ lịch sử tiêu thụ' })
  @ApiResponse({ status: 200, description: 'Consumption histories retrieved successfully.' })
  async findAll(@User() user: JwtUser) {
    const data = await this.consumptionService.findAll(user);
    return buildSuccessResponse(ResponseCode.C00176, data);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy ra bản ghi lịch sử tiêu thụ theo ID' })
  @ApiResponse({ status: 200, description: 'Consumption history retrieved successfully.' })
  async findOne(@Param('id') id: string, @User() user: JwtUser) {
    const data = await this.consumptionService.findOne(+id, user);
    return buildSuccessResponse(ResponseCode.C00177, data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật bản ghi lịch sử tiêu thụ theo ID' })
  @ApiResponse({ status: 200, description: 'Consumption history updated successfully.' })
  async update(@Param('id') id: string, @Body() dto: UpdateConsumptionHistoryDto, @User() user: JwtUser) {
    const data = await this.consumptionService.update(+id, dto, user);
    return buildSuccessResponse(ResponseCode.C00178, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa bản ghi lịch sử tiêu thụ theo ID' })
  @ApiResponse({ status: 200, description: 'Consumption history deleted successfully.' })
  async remove(@Param('id') id: string, @User() user: JwtUser) {
    const data = await this.consumptionService.remove(+id, user);
    return buildSuccessResponse(ResponseCode.C00179, data);
  }

  /** Ghi log tiêu thụ */
  @Post('log')
  @ApiOperation({ summary: 'Ghi log tiêu thụ nguyên liệu/món ăn' })
  @ApiResponse({ status: 201, description: 'Consumption logged successfully.' })
  async logConsumption(@Body() dto: CreateConsumptionHistoryDto, @User() user: JwtUser) {
    const data = await this.consumptionService.logConsumption(dto, user);
    return buildSuccessResponse(ResponseCode.C00180, data);
  }

  /** Thống kê theo tháng của người dùng */
  @Get('statistics-user/monthly')
  @ApiOperation({ summary: 'Lấy ra thống kê tiêu thụ theo tháng trong năm' })
  @ApiResponse({ status: 200, description: 'Monthly statistics retrieved successfully.' })
  async monthlyStatisticsUser(
    @Query('year') year: string,
    @Query('userId') userId: string,
    @User() user: JwtUser,
  ) {
    const data = await this.consumptionService.monthlyStatisticsUser(+year, +userId, user);
    return buildSuccessResponse(ResponseCode.C00181, data);
  }

  /** Top nguyên liệu/món tiêu thụ của người dùng*/
  @Get('statistics-user/top')
  @ApiOperation({ summary: 'Lấy ra top nguyên liệu/món ăn được tiêu thụ nhiều nhất' })
  @ApiResponse({ status: 200, description: 'Top consumed items retrieved successfully.' })
  async topConsumedUser(
    @Query('type') type: 'dish' | 'ingredient',
    @Query('limit') limit: string = '5',
    @User() user: JwtUser,
    @Query('userId') userId?: string,
  ) {
    const limitNumber = parseInt(limit, 10) || 5;
    const userIdNumber = userId ? parseInt(userId, 10) : undefined;
    const data = await this.consumptionService.topConsumedUser(type, limitNumber, user, userIdNumber);
    return buildSuccessResponse(ResponseCode.C00182, data);
  }

  /** Thống kê theo tháng của gia đình */
  @Get('statistics-family/monthly')
  @ApiOperation({ summary: 'Lấy thống kê tiêu thụ theo tháng trong năm của gia đình' })
  @ApiResponse({ status: 200, description: 'Monthly family statistics retrieved successfully.' })
  async monthlyStatisticsFamily(
    @Query('year') year: string,
    @Query('familyId') familyId: string,
    @User() user: JwtUser,
  ) {
    const data = await this.consumptionService.monthlyStatisticsFamily(
      Number(year),
      Number(familyId),
      user,
    );
    return buildSuccessResponse(ResponseCode.C00183, data);
  }

  /** Top nguyên liệu/món tiêu thụ của gia đình */
  @Get('statistics-family/top')
  @ApiOperation({ summary: 'Lấy top nguyên liệu/món ăn được tiêu thụ nhiều nhất trong gia đình' })
  @ApiResponse({ status: 200, description: 'Top consumed items in family retrieved successfully.' })
  async topConsumedFamily(
    @Query('type') type: 'dish' | 'ingredient',
    @Query('limit') limit: string = '5',
    @Query('familyId') familyId: string,
    @User() user: JwtUser,
  ) {
    const limitNumber = Number(limit) || 5;
    const familyIdNumber = Number(familyId);

    const data = await this.consumptionService.topConsumedFamily(
      type,
      limitNumber,
      user,
      familyIdNumber,
    );
    return buildSuccessResponse(ResponseCode.C00184, data);
  }

  /** Thống kê theo user */
  @Get('statistics-user/:userId')
  @ApiOperation({ summary: 'Lấy ra thống kê tiêu thụ theo user' })
  @ApiResponse({ status: 200, description: 'User statistics retrieved successfully.' })
  statisticsByUser(@Param('userId') userId: string, @User() user: JwtUser) {
    return this.consumptionService.statisticsByUser(+userId, user);
  }

  /** Thống kê theo family */
  @Get('statistics-family/:familyId')
  @ApiOperation({ summary: 'Lấy ra thống kê tiêu thụ theo family' })
  @ApiResponse({ status: 200, description: 'Family statistics retrieved successfully.' })
  statisticsByFamily(@Param('familyId') familyId: string, @User() user: JwtUser) {
    return this.consumptionService.statisticsByFamily(+familyId, user);
  }
}
