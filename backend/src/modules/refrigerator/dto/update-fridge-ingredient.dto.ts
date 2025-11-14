import { PartialType } from '@nestjs/mapped-types';
import { CreateFridgeIngredientDto } from './create-fridge-ingredient.dto';

export class UpdateFridgeIngredientDto extends PartialType(CreateFridgeIngredientDto) { }
