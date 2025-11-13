import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateRefrigeratorDto {
    @IsNotEmpty()
    @IsNumber()
    owner_id: number;

    @IsOptional() // family_id có thể null
    @IsNumber()
    family_id?: number;
}
