import { IsOptional, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetRecipesDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  dishId?: number;

  @IsOptional()
  ownerId?: number;
}


