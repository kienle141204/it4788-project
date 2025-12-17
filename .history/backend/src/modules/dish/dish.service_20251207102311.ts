import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Dish } from '../../entities/dish.entity';
import { DishReview } from '../../entities/dish-review.entity';
import { MenuDish } from '../../entities/menu-dish.entity';
import { CreateDishDto } from './dto/create-dish.dto';
import { PaginationDto, SearchDishDto } from './dto/pagination.dto';
import { TopRatedDishesDto, TopDishesDto } from './dto/top-dishes.dto';
import { User } from '../../entities/user.entity';

@Injectable()
export class DishService {
  constructor(
    @InjectRepository(Dish)
    private dishRepository: Repository<Dish>,
    @InjectRepository(DishReview)
    private dishReviewRepository: Repository<DishReview>,
    @InjectRepository(MenuDish)
    private menuDishRepository: Repository<MenuDish>,
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

  /**
   * Lấy top món ăn theo số sao trung bình của review
   */
  async getTopRatedDishes(dto: TopRatedDishesDto): Promise<Array<Dish & { avgRating: number; reviewCount: number }>> {
    const { top, minRating, month, year } = dto;

    // Xác định tháng và năm
    const now = new Date();
    const targetMonth = month || now.getMonth() + 1; // 1-12
    const targetYear = year || now.getFullYear();

    // Tính toán startDate và endDate cho tháng
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    // Query để lấy top dishes theo rating trung bình
    const result = await this.dishReviewRepository
      .createQueryBuilder('review')
      .select('review.dish_id', 'dishId')
      .addSelect('AVG(review.rating)', 'avgRating')
      .addSelect('COUNT(review.id)', 'reviewCount')
      .where('review.created_at >= :startDate', { startDate })
      .andWhere('review.created_at <= :endDate', { endDate })
      .groupBy('review.dish_id')
      .having('AVG(review.rating) >= :minRating', { minRating })
      .orderBy('avgRating', 'DESC')
      .addOrderBy('reviewCount', 'DESC')
      .limit(top)
      .getRawMany();

    // Lấy thông tin chi tiết của các dishes
    const dishIds = result.map((r) => r.dishId);
    if (dishIds.length === 0) {
      return [];
    }

    const dishes = await this.dishRepository
      .createQueryBuilder('dish')
      .where('dish.id IN (:...ids)', { ids: dishIds })
      .getMany();

    // Kết hợp dữ liệu
    const dishesWithRating = result
      .map((r) => {
        const dish = dishes.find((d) => d.id === r.dishId);
        if (!dish) return null;
        return {
          ...dish,
          avgRating: parseFloat(r.avgRating),
          reviewCount: parseInt(r.reviewCount),
        };
      })
      .filter((dish): dish is Dish & { avgRating: number; reviewCount: number } => dish !== null);

    return dishesWithRating;
  }

  /**
   * Lấy top món ăn được thêm vào menu nhiều nhất
   */
  async getTopMenuDishes(dto: TopDishesDto): Promise<Array<Dish & { menuCount: number }>> {
    const { top, month, year } = dto;

    // Xác định tháng và năm
    const now = new Date();
    const targetMonth = month || now.getMonth() + 1; // 1-12
    const targetYear = year || now.getFullYear();

    // Tính toán startDate và endDate cho tháng
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    // Query để lấy top dishes theo số lần được thêm vào menu
    const result = await this.menuDishRepository
      .createQueryBuilder('menuDish')
      .select('menuDish.dish_id', 'dishId')
      .addSelect('COUNT(menuDish.id)', 'menuCount')
      .where('menuDish.created_at >= :startDate', { startDate })
      .andWhere('menuDish.created_at <= :endDate', { endDate })
      .groupBy('menuDish.dish_id')
      .orderBy('menuCount', 'DESC')
      .limit(top)
      .getRawMany();

    // Lấy thông tin chi tiết của các dishes
    const dishIds = result.map((r) => r.dishId);
    if (dishIds.length === 0) {
      return [];
    }

    const dishes = await this.dishRepository
      .createQueryBuilder('dish')
      .where('dish.id IN (:...ids)', { ids: dishIds })
      .getMany();

    // Kết hợp dữ liệu
    const dishesWithCount = result.map((r) => {
      const dish = dishes.find((d) => d.id === r.dishId);
      return {
        ...dish,
        menuCount: parseInt(r.menuCount),
      };
    }).filter(dish => dish.id); // Lọc các dish không tìm thấy

    return dishesWithCount;
  }
}
