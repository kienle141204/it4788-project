import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateChatDto {
    @ApiProperty({ example: 'Thông báo' })
    @IsString()
    title: string;

    @ApiProperty({ example: 'Mua thêm thịt bò nhé' })
    @IsString()
    message: string;

    @ApiProperty({ example: 1 })
    @IsNumber()
    familyId: number;

    @ApiProperty({
        required: false,
        example: { type: 'link', url: 'https://example.com' },
    })
    @IsOptional()
    data?: Record<string, any>;
}
