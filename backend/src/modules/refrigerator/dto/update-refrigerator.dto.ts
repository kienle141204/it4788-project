import { PartialType } from '@nestjs/mapped-types';
import { CreateRefrigeratorDto } from './create-refrigerator.dto';
import { IsOptional, IsNumber } from 'class-validator';

export class UpdateRefrigeratorDto extends PartialType(CreateRefrigeratorDto) { }
