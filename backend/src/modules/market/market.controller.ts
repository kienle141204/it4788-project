import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { MarketService } from './market.service';

@Controller('api/markets')
export class MarketController {
  constructor(private readonly marketService: MarketService) { }

  @Get('nearest')
  getNearestMarkets(
    @Query('lat') lat: string,
    @Query('lon') lon: string,
  ) {
    if (!lat || !lon) {
      throw new BadRequestException('Latitude and longitude are required');
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new BadRequestException('Invalid latitude or longitude');
    }

    return this.marketService.findNearest(latitude, longitude);
  }
}
