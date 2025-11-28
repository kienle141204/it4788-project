import { PartialType } from '@nestjs/swagger';
import { CreateConsumptionHistoryDto } from './create-consumption-history.dto';

export class UpdateConsumptionHistoryDto extends PartialType(CreateConsumptionHistoryDto) { }
