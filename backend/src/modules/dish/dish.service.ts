import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dish } from '../../entities/dish.entity';
import { CreateDishDto } from './dto/create-dish.dto';
import { PaginationDto, SearchDishDto } from './dto/pagination.dto';
import { User } from '../../entities/user.entity';

@Injectable()
export class DishService {
  constructor(
    @InjectRepository(Dish)
    private dishRepository: Repository<Dish>,
  ) {}

  /**
   * Lấy tất cả món ăn (không cần authentication)
   */
  async findAll(): Promise<Dish[]> {
    return await this.dishRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Lấy món ăn theo ID (không cần authentication)
   */
  async findOne(id: number): Promise<Dish> {
    const dish = await this.dishRepository.findOne({ where: { id } });
    
    if (!dish) {
      throw new NotFoundException('Không tìm thấy món ăn');
    }
    
    return dish;
  }

  /**
   * Tạo món ăn mới
   */
  async create(createDishDto: CreateDishDto, user: User): Promise<Dish> {
    const dish = this.dishRepository.create({
      ...createDishDto,
      owner_id: user.id,
    });
    return await this.dishRepository.save(dish);
  }

  /**
   * Lấy tất cả món ăn với phân trang (không cần authentication)
   */
  async findAllWithPagination(paginationDto: PaginationDto): Promise<{
    data: Dish[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.dishRepository.findAndCount({
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Tìm kiếm món ăn theo tên với phân trang (không cần authentication)
   */
  async searchByNameWithPagination(searchDto: SearchDishDto): Promise<{
    data: Dish[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    searchTerm: string;
  }> {
    const { name = '', page = 1, limit = 10 } = searchDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.dishRepository
      .createQueryBuilder('dish')
      .orderBy('dish.created_at', 'DESC');

    if (name.trim()) {
      queryBuilder.where('dish.name LIKE :name', { name: `%${name.trim()}%` });
    }

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      searchTerm: name.trim(),
    };
  }
}
