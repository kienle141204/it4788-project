import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

// DTO cho phân trang cơ bản
export class PaginationDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

// DTO cho tìm kiếm theo tên
export class SearchByNameDto extends PaginationDto {
  @IsOptional()
  @IsString()
  name?: string;
}

// DTO cho tìm kiếm theo địa chỉ (place)
export class SearchByPlaceDto extends PaginationDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  place_id?: number;
}

// DTO cho tìm kiếm theo danh mục (category)
export class SearchByCategoryDto extends PaginationDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  category_id?: number;
}

// DTO cho tìm kiếm đầy đủ (nhiều filter)
export class SearchIngredientDto extends PaginationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  place_id?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  category_id?: number;
}
