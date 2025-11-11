import { Injectable } from '@nestjs/common';
import { CreateRefrigeratorDto } from '../dto/create-refrigerator.dto';
import { UpdateRefrigeratorDto } from '../dto/update-refrigerator.dto';

@Injectable()
export class RefrigeratorService {
  create(createRefrigeratorDto: CreateRefrigeratorDto) {
    return 'This action adds a new refrigerator';
  }

  findAll() {
    return `This action returns all refrigerator`;
  }

  findOne(id: number) {
    return `This action returns a #${id} refrigerator`;
  }

  update(id: number, updateRefrigeratorDto: UpdateRefrigeratorDto) {
    return `This action updates a #${id} refrigerator`;
  }

  remove(id: number) {
    return `This action removes a #${id} refrigerator`;
  }
}
