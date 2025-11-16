import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, ValidateNested } from 'class-validator';

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

    @ApiProperty({ default: false })
    @IsOptional()
    @IsBoolean()
    is_shared?: boolean;
}
