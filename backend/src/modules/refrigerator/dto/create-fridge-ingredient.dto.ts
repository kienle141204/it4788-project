import {
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPositive,
    IsInt,
    Min,
} from 'class-validator';

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
}
