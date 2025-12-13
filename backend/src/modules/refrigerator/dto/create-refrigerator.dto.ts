import { IsNumber, IsOptional, ValidateIf } from 'class-validator';

export class CreateRefrigeratorDto {
    @ValidateIf((o) => o.owner_id !== undefined && o.owner_id !== null)
    @IsNumber()
    owner_id?: number;

    @ValidateIf((o) => o.family_id !== undefined && o.family_id !== null)
    @IsNumber()
    @IsOptional() // Nếu family_id là null thì tự tạo tủ lạnh cho bản thân
    family_id?: number;
}
