import { IsString, MinLength } from 'class-validator';

export class CreateFamilyDto {
  @IsString({ message: 'Tên gia đình phải là chuỗi' })
  @MinLength(2, { message: 'Tên gia đình phải có ít nhất 2 ký tự' })
  name: string;
}


