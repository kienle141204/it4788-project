import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ConsumptionHistoryService } from './consumption-history.service';
import { CreateConsumptionHistoryDto } from './dto/create-consumption-history.dto';
import { UpdateConsumptionHistoryDto } from './dto/update-consumption-history.dto';

@Controller('consumption-history')
export class ConsumptionHistoryController {
  constructor(private readonly consumptionService: ConsumptionHistoryService) { }

  @Post()
  create(@Body() dto: CreateConsumptionHistoryDto) {
    return this.consumptionService.create(dto);
  }

  @Get()
  findAll() {
    return this.consumptionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.consumptionService.findOne(Number(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateConsumptionHistoryDto) {
    return this.consumptionService.update(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.consumptionService.remove(Number(id));
  }
  /** Ghi log tiêu thụ */
  @Post('log')
  logConsumption(@Body() body: { user_id: number; family_id?: number; consume_type: 'dish' | 'ingredient'; stock: number }) {
    return this.consumptionService.logConsumption(body);
  }

  /** Thống kê theo tháng */
  @Get('statistics/monthly')
  monthlyStatistics(@Query('year') year: number, @Query('userId') userId: number) {
    return this.consumptionService.monthlyStatistics(+year, +userId);
  }

  /** Top nguyên liệu/món tiêu thụ */
  @Get('statistics/top')
  topConsumed(@Query('type') type: 'dish' | 'ingredient', @Query('limit') limit?: number, @Query('userId') userId?: number) {
    return this.consumptionService.topConsumed(type, limit ? +limit : 5, userId ? +userId : undefined);
  }

  /** Thống kê theo user */
  @Get('statistics/user/:userId')
  statisticsByUser(@Param('userId') userId: number) {
    return this.consumptionService.statisticsByUser(+userId);
  }

  /** Thống kê theo family */
  @Get('statistics/family/:familyId')
  statisticsByFamily(@Param('familyId') familyId: number) {
    return this.consumptionService.statisticsByFamily(+familyId);
  }
}
