import { PartialType } from '@nestjs/mapped-types';
import { CreateFridgeDishDto } from './create-fridge-dish.dto';

export class UpdateFridgeDishDto extends PartialType(CreateFridgeDishDto) { }
