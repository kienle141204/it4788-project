import { IsInt, IsString, IsOptional, IsArray, ValidateNested, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRecipeStepDto {
  @IsInt()
  @Min(1)
  step_number: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateRecipeDto {
  @IsInt()
  dish_id: number;

  @IsOptional()
  @IsEnum(['public', 'private'])
  status?: string = 'public';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeStepDto)
  steps: CreateRecipeStepDto[];
}

export class UpdateRecipeStepDto {
  @IsInt()
  @Min(1)
  step_number: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateRecipeDto {
  @IsOptional()
  @IsEnum(['public', 'private'])
  status?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateRecipeStepDto)
  steps: UpdateRecipeStepDto[];
}

