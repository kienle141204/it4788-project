import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsNumber, IsOptional, ValidateNested } from 'class-validator';

export class CreateShoppingListDto {
    @ApiProperty()
    @IsOptional()
    @IsNumber()
    owner_id: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    family_id?: number;

    @ApiProperty({ default: 0 })
    @IsOptional()
    @IsNumber()
    cost?: number;

    @ApiProperty({ default: true })
    @IsOptional()
    @IsBoolean()
    is_shared?: boolean;

    @ApiProperty({ description: 'Ngày mua sắm', example: '2024-06-15' })
    @IsOptional()
    @IsDateString()
    shopping_date: Date;
}
