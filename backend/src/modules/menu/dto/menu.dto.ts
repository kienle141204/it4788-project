import { IsString, IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { MenuTime } from '../../../entities/menu.entity';

export class CreateMenuDto {
  @IsOptional()
  @IsEnum(MenuTime, {
    message: 'Time must be one of: breakfast, morning_snack, lunch, afternoon_snack, dinner, late_night',
  })
  time?: MenuTime;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateMenuDto {
  @IsOptional()
  @IsEnum(MenuTime, {
    message: 'Time must be one of: breakfast, morning_snack, lunch, afternoon_snack, dinner, late_night',
  })
  time?: MenuTime;

  @IsOptional()
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

  @IsOptional()
  @IsEnum(MenuTime, {
    message: 'Time must be one of: breakfast, morning_snack, lunch, afternoon_snack, dinner, late_night',
  })
  time?: MenuTime;
}

export class GetMenuDishesByDateDto {
  @IsOptional()
  @IsString()
  date?: string;
}


