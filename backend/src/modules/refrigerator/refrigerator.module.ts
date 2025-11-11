import { Module } from '@nestjs/common';
import { RefrigeratorService } from './refrigerator.service';
import { RefrigeratorController } from './refrigerator.controller';

@Module({
  controllers: [RefrigeratorController],
  providers: [RefrigeratorService],
})
export class RefrigeratorModule {}
