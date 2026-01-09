import {
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPositive,
    IsInt,
    Min,
    IsDate,
    IsString
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFridgeIngredientDto {
    @IsOptional()
    @IsNumber()
    ingredient_id?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    dish_ingredient_id?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    stock?: number;

    @IsOptional()
    @IsNumber()
    price?: number;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    expiration_date?: Date;

    @IsOptional()
    @IsString()
    note?: string;
}
