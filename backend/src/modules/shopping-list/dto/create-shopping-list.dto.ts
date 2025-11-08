import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { CreateShoppingItemDto } from '../../shopping-item/dto/create-shopping-item.dto';

export class CreateShoppingListDto {
    @ApiProperty()
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

    @ApiProperty({ type: [CreateShoppingItemDto], required: false })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateShoppingItemDto)
    items?: CreateShoppingItemDto[];
}
