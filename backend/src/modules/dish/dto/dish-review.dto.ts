import { IsInt, IsString, IsOptional, Min, Max, IsNotEmpty } from 'class-validator';

export class CreateDishReviewDto {
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class UpdateDishReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
