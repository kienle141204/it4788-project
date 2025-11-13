import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class CreateFridgeIngredientDto {
    @IsNotEmpty()
    @IsNumber()
    refrigerator_id: number;

    @IsNotEmpty()
    @IsNumber()
    ingredient_id: number;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    stock?: number;

    @IsOptional()
    @IsNumber()
    price?: number;
}
