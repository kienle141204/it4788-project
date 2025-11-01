import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateMenuDto {
  @IsString()
  description?: string;
}

export class CreateMenuDishDto {
  @IsInt()
  dish_id: number;

  @IsInt()
  @Min(0)
  stock: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  price?: number;
}

export class UpdateMenuDishDto {
  @IsInt()
  @Min(0)
  stock: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  price?: number;
}

export class GetMenusDto {
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

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  familyId?: number;
}


