import { IsNumber } from 'class-validator';

export class JoinFamilyDto {
  @IsNumber({}, { message: 'ID gia đình phải là số' })
  family_id: number;
}


