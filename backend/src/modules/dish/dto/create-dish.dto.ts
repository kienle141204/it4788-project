import { IsString, IsOptional, IsNotEmpty, MaxLength, Allow } from 'class-validator';

export class CreateDishDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Allow()
  @MaxLength(500)
  image_url?: string;
}
