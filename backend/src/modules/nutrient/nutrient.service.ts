import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Nutrient } from '../../entities/nutrient.entity';
import { Dish } from '../../entities/dish.entity';
import { ResponseCode, ResponseMessageVi } from 'src/common/errors/error-codes';

@Injectable()
export class NutrientService {
  constructor(
    @InjectRepository(Nutrient)
    private readonly nutrientRepository: Repository<Nutrient>,
    @InjectRepository(Dish)
    private readonly dishRepository: Repository<Dish>,
  ) {}

  /**
   * Lấy tất cả dinh dưỡng
   */
  async findAll(): Promise<Nutrient[]> {
    return await this.nutrientRepository.find({
      order: { id: 'ASC' },
    });
  }

  /**
   * Lấy dinh dưỡng theo ID
   */
  async findOne(id: number): Promise<Nutrient> {
    const nutrient = await this.nutrientRepository.findOne({
      where: { id },
      relations: ['dishes'],
    });

    if (!nutrient) {
      throw new NotFoundException(ResponseMessageVi[ResponseCode.C00280]);
    }

    return nutrient;
  }

  /**
   * Lấy dinh dưỡng của món ăn theo dish ID
   */
  async findByDishId(dishId: number): Promise<Nutrient[]> {
    const dish = await this.dishRepository.findOne({
      where: { id: dishId },
      relations: ['nutrients'],
    });

    if (!dish) {
      throw new NotFoundException(ResponseMessageVi[ResponseCode.C00100]);
    }

    return dish.nutrients || [];
  }

  /**
   * Lấy thông tin dinh dưỡng của một món ăn theo ID món (bao gồm thông tin món ăn)
   */
  async getNutrientsByDishId(dishId: number): Promise<{
    dish: { id: number; name: string };
    nutrients: Nutrient[];
  }> {
    const dish = await this.dishRepository.findOne({
      where: { id: dishId },
      relations: ['nutrients'],
    });

    if (!dish) {
      throw new NotFoundException(ResponseMessageVi[ResponseCode.C00100]);
    }

    return {
      dish: {
        id: dish.id,
        name: dish.name,
      },
      nutrients: dish.nutrients || [],
    };
  }
}

