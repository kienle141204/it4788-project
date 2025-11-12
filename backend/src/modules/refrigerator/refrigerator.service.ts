import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Refrigerator } from '../../entities/refrigerator.entity';
import { CreateRefrigeratorDto } from './dto/create-refrigerator.dto';
import { UpdateRefrigeratorDto } from './dto/update-refrigerator.dto';

@Injectable()
export class RefrigeratorService {
  constructor(
    @InjectRepository(Refrigerator)
    private readonly refrigeratorRepo: Repository<Refrigerator>,
  ) { }

  async create(dto: CreateRefrigeratorDto): Promise<Refrigerator> {
    const fridge = this.refrigeratorRepo.create(dto);
    return await this.refrigeratorRepo.save(fridge);
  }

  async findAll(): Promise<Refrigerator[]> {
    return this.refrigeratorRepo.find({ relations: ['owner', 'family'] });
  }

  async findOne(id: number): Promise<Refrigerator> {
    const fridge = await this.refrigeratorRepo.findOne({
      where: { id },
      relations: ['owner', 'family'],
    });
    if (!fridge) throw new NotFoundException(`Refrigerator #${id} not found`);
    return fridge;
  }

  async update(id: number, dto: UpdateRefrigeratorDto): Promise<Refrigerator> {
    const fridge = await this.findOne(id);
    Object.assign(fridge, dto);
    return await this.refrigeratorRepo.save(fridge);
  }

  async remove(id: number): Promise<void> {
    const fridge = await this.findOne(id);
    await this.refrigeratorRepo.remove(fridge);
  }
}
