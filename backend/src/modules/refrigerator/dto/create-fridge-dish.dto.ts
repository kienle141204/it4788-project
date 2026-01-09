import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsDate, IsString } from 'class-validator';
import { Type } from 'class-transformer';

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

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    expiration_date?: Date;

    @IsOptional()
    @IsString()
    note?: string;
}
