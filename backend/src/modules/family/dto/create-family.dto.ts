import { IsString, IsInt, MinLength } from 'class-validator';

export class CreateFamilyDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsInt()
  owner_id: number;
}
