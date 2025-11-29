import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateConsumptionHistoryDto {
    @IsNotEmpty()
    family_id: number;

    @IsNotEmpty()
    user_id: number;

    @IsEnum(['dish', 'ingredient'])
    consume_type: 'dish' | 'ingredient';

    @IsNotEmpty()
    item_id: number; // dish_id hoặc ingredient_id

    @IsInt()
    stock: number;

    @IsOptional()
    @IsNumber()
    value?: number;
}
