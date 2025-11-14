import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class CreateFridgeDishDto {
    @IsNotEmpty()
    @IsNumber()
    dish_id: number;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    stock?: number;

    @IsOptional()
    @IsNumber()
    price?: number;
}
