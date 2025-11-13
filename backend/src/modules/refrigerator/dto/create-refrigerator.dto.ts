import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateRefrigeratorDto {
    @IsNotEmpty()
    @IsNumber()
    owner_id: number;

    @IsOptional() // Nếu family_id là null thì tự tạo tủ lạnh cho bản thân
    @IsNumber()
    family_id?: number;
}
