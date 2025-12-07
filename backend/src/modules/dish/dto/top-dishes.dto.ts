import { IsNumber, IsOptional, Min, Max, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class TopDishesDto {
  @ApiProperty({
    description: 'Số lượng món ăn top (3, 10, hoặc 20)',
    example: 10,
    enum: [3, 10, 20],
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  top: number;

  @ApiPropertyOptional({
    description: 'Tháng (1-12), mặc định là tháng hiện tại',
    example: 12,
    minimum: 1,
    maximum: 12,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month?: number;

  @ApiPropertyOptional({
    description: 'Năm (ví dụ: 2024), mặc định là năm hiện tại',
    example: 2024,
    minimum: 2000,
    maximum: 2100,
  })
  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  @Type(() => Number)
  year?: number;
}

export class TopRatedDishesDto extends TopDishesDto {
  @ApiProperty({
    description: 'Mốc số sao tối thiểu (ví dụ: 4 = từ 4 sao trở lên)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  minRating: number;
}

