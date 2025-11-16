import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateShoppingItemDto {
    @ApiProperty()
    @IsNumber()
    list_id: number;

    @ApiProperty()
    @IsNumber()
    ingredient_id: number;

    @ApiProperty({ default: 0 })
    @IsOptional()
    @IsNumber()
    stock?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    price?: number;

    @ApiProperty({ default: false })
    @IsOptional()
    @IsBoolean()
    is_checked?: boolean;
}
