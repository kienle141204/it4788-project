import { IsOptional, IsBoolean, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNotificationDto {
  @ApiPropertyOptional({
    description: 'Tiêu đề thông báo',
    example: 'Thông báo đã cập nhật',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Nội dung thông báo',
    example: 'Nội dung thông báo đã được cập nhật',
  })
  @IsString()
  @IsOptional()
  body?: string;

  @ApiPropertyOptional({
    description: 'Trạng thái đã đọc',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  is_read?: boolean;
}

