import { IsString, IsInt, MinLength, IsOptional } from 'class-validator';

export class CreateFamilyDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsInt()
  @IsOptional()
  owner_id: number;
}
