import { Injectable, NotFoundException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Refrigerator } from '../../entities/refrigerator.entity';
import { CreateRefrigeratorDto } from './dto/create-refrigerator.dto';
import { UpdateRefrigeratorDto } from './dto/update-refrigerator.dto';
import { PaginationDto } from './dto/pagination.dto';
import type { JwtUser } from '../../common/types/user.type';
import { FamilyService } from '../family/family.service';
import { FridgeIngredient } from '../../entities/fridge-ingredient.entity';
import { DishesIngredients } from '../../entities/dishes-ingredients.entity';
import { Ingredient } from '../../entities/ingredient.entity';
import { Dish } from '../../entities/dish.entity';
import { ResponseCode, ResponseMessageVi } from 'src/common/errors/error-codes';

@Injectable()
export class RefrigeratorService {
  constructor(
    @InjectRepository(Refrigerator)
    private readonly refrigeratorRepo: Repository<Refrigerator>,

    @InjectRepository(FridgeIngredient)
    private readonly fridgeIngredientRepo: Repository<FridgeIngredient>,

    @InjectRepository(DishesIngredients)
    private readonly dishesIngredientsRepo: Repository<DishesIngredients>,

    @InjectRepository(Ingredient)
    private readonly ingredientRepo: Repository<Ingredient>,

    @InjectRepository(Dish)
    private readonly dishRepo: Repository<Dish>,

    private readonly familyService: FamilyService,
  ) { }

  // Tạo ra tủ lạnh cho gia đình nếu có family_id, cho cá nhân nếu không có 
  async create(dto: CreateRefrigeratorDto, user: JwtUser): Promise<Refrigerator> {
    // Nếu là admin => có quyền tạo cho bất kỳ family nào
    if (user.role === 'admin') {
      const fridge = this.refrigeratorRepo.create(dto);
      return await this.refrigeratorRepo.save(fridge);
    }

    // Nếu có family_id → kiểm tra quyền sở hữu
    if (dto.family_id) {
      const family = await this.familyService.getFamilyById(dto.family_id);

      // Người tạo phải là chủ của family
      if (family.owner_id !== user.id) {
        throw new UnauthorizedException(ResponseMessageVi[ResponseCode.C00231]);
      }

      // Kiểm tra đã có tủ lạnh nào trong family chưa (1 family 1 tủ lạnh)
      const existing = await this.refrigeratorRepo.findOne({
        where: { family_id: dto.family_id },
      });

      if (existing) {
        throw new ConflictException(ResponseMessageVi[ResponseCode.C00232]);
      }
    }

    // Nếu có owner_id trong DTO mà khác user.id → chặn
    if (dto.owner_id && dto.owner_id !== user.id) {
      throw new UnauthorizedException(ResponseMessageVi[ResponseCode.C00233]);
    }

    // Tạo mới
    const fridge = this.refrigeratorRepo.create({
      ...dto,
      owner_id: user.id, // đảm bảo người tạo là chủ (trừ khi admin)
    });

    return await this.refrigeratorRepo.save(fridge);
  }

  // Đưa ra toàn bộ tủ lạnh (admin) với phân trang
  async findAll(paginationDto: PaginationDto): Promise<{
    data: Refrigerator[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.refrigeratorRepo.findAndCount({
      relations: ['owner', 'family'],
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

  // Đưa ra tủ lạnh có id, chỉ có thành viên trong gia đình mới xem được
  async findOne(id: number, user: JwtUser): Promise<Refrigerator> {
    const fridge = await this.refrigeratorRepo.findOne({
      where: { id },
      relations: ['owner', 'family', 'family.members', "fridgeIngredients", "fridgeIngredients.ingredient", "fridgeIngredients.dishIngredient", "fridgeDishes", "fridgeDishes.dish"], // đảm bảo members được load
    });

    if (!fridge) throw new NotFoundException(ResponseMessageVi[ResponseCode.C00230]);

    // Kiểm tra quyền: admin hoặc owner hoặc member family
    const isOwner = fridge.owner_id === user.id;
    const isMember = fridge.family?.members?.some(member => member.id === user.id);
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isMember && !isAdmin) {
      throw new UnauthorizedException(ResponseMessageVi[ResponseCode.C00234]);
    }

    return fridge;
  }

  // Đưa ra các tủ lạnh mình sở hữu với phân trang
  async myFridge(user: JwtUser, paginationDto: PaginationDto): Promise<{
    data: Refrigerator[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.refrigeratorRepo.findAndCount({
      where: { owner_id: user.id },
      relations: ['owner', 'family', 'family.members'],
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

  // Đưa ra tủ lạnh của cùng gia đình có id với phân trang
  async myFamilyFridge(family_id: number, user: JwtUser, paginationDto: PaginationDto): Promise<{
    data: Refrigerator[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Kiểm tra quyền truy cập family
    const family = await this.familyService.getFamilyById(family_id);
    const isOwner = family.owner_id === user.id;
    const isMember = family.members?.some(member => member.id === user.id) ?? false;
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isMember && !isAdmin) {
      throw new UnauthorizedException(ResponseMessageVi[ResponseCode.C00234]);
    }

    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.refrigeratorRepo.findAndCount({
      where: { family_id },
      relations: ['owner', 'family', 'family.members'],
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

  // Cập nhật
  async update(id: number, dto: UpdateRefrigeratorDto, user: JwtUser): Promise<Refrigerator> {
    const fridge = await this.findOne(id, user);
    Object.assign(fridge, dto);
    return await this.refrigeratorRepo.save(fridge);
  }

  async remove(id: number, user: JwtUser): Promise<void> {
    // Lấy tủ lạnh (không cần check family member nữa)
    const fridge = await this.refrigeratorRepo.findOne({
      where: { id },
      relations: ['owner'], // chỉ load owner là đủ
    });

    if (!fridge) {
      throw new NotFoundException(ResponseMessageVi[ResponseCode.C00230]);
    }

    // Kiểm tra quyền: admin hoặc owner
    const isOwner = fridge.owner_id === user.id;
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new UnauthorizedException(ResponseMessageVi[ResponseCode.C00234]);
    }

    await this.refrigeratorRepo.remove(fridge);
  }

  /**
   * Gợi ý các món ăn dựa trên nguyên liệu hiện có trong tủ lạnh với phân trang
   */
  async suggestDishes(refrigerator_id: number, user: JwtUser, paginationDto: PaginationDto): Promise<{
    data: Array<{
      dishId: number;
      dishName: string;
      matchCount: number;
      totalIngredients: number;
      matchPercentage: number;
      matchedIngredients: string[];
      missingIngredients: string[];
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // đảm bảo người dùng có quyền truy cập tủ lạnh
    await this.findOne(refrigerator_id, user);

    const { page = 1, limit = 10 } = paginationDto;

    const fridgeIngredients = await this.fridgeIngredientRepo.find({
      where: { refrigerator_id },
      relations: ['ingredient'],
    });

    if (!fridgeIngredients.length) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

      const fridgeIngredientNames = Array.from(
        new Set(
          fridgeIngredients
            .map((item) => item.ingredient?.name?.trim().toLowerCase())
            .filter((name): name is string => Boolean(name)),
        ),
      );

    if (!fridgeIngredientNames.length) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

      const matchingDishIngredients = await this.dishesIngredientsRepo
        .createQueryBuilder('di')
        .leftJoinAndSelect('di.dish', 'dish')
        .where('LOWER(di.ingredient_name) IN (:...names)', { names: fridgeIngredientNames })
        .getMany();

    if (!matchingDishIngredients.length) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

      const [allDishIngredients, dishes] = await Promise.all([
        this.dishesIngredientsRepo.find({ where: { dish_id: In(dishIds) } }),
        this.dishRepo.find({ where: { id: In(dishIds) } }),
      ]);

      const dishMap = new Map(dishes.map((dish) => [dish.id, dish]));

      const suggestions = dishIds
        .map((dishId) => {
          const dish = dishMap.get(dishId);
          if (!dish) return null;

          const dishIngredients = allDishIngredients.filter((item) => item.dish_id === dishId);
          const matchedIngredients = matchingDishIngredients.filter((item) => item.dish_id === dishId);

          const matchedNames = Array.from(new Set(matchedIngredients.map((item) => item.ingredient_name).filter(Boolean)));
          const allNames = Array.from(new Set(dishIngredients.map((item) => item.ingredient_name).filter(Boolean)));

          const missingNames = allNames.filter((name) => !matchedNames.includes(name));
          const totalIngredients = allNames.length;
          const matchCount = matchedNames.length;
          const matchPercentage = totalIngredients ? Number((matchCount / totalIngredients).toFixed(2)) : 0;

          return {
            dishId: dish.id,
            dishName: dish.name,
            matchCount,
            totalIngredients,
            matchPercentage,
            matchedIngredients: matchedNames,
            missingIngredients: missingNames,
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
        .sort((a, b) => {
          if (b.matchPercentage !== a.matchPercentage) {
            return b.matchPercentage - a.matchPercentage;
          }
          return b.matchCount - a.matchCount;
        });

      return suggestions;
    } catch (error: any) {
      // Log lỗi để debug
      console.error('Error in suggestDishes:', {
        refrigerator_id,
        error: error.message,
        code: error.code,
        errno: error.errno,
        stack: error.stack,
      });

    // Áp dụng phân trang
    const skip = (page - 1) * limit;
    const total = suggestions.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedData = suggestions.slice(skip, skip + limit);

    return {
      data: paginatedData,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
