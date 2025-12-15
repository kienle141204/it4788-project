import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'ID của người dùng nhận thông báo',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  user_id: number;

  @ApiProperty({
    description: 'Tiêu đề thông báo',
    example: 'Thông báo mới',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Nội dung thông báo',
    example: 'Bạn có một thông báo mới từ hệ thống',
  })
  @IsString()
  @IsOptional()
  body?: string;
}

