import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Ingredient } from '../../entities/ingredient.entity';
import { IngredientCategory } from '../../entities/ingredient-category.entity';
import { Place } from '../../entities/place.entity';
import { DishesIngredients } from '../../entities/dishes-ingredients.entity';
import { ResponseCode, ResponseMessageVi } from 'src/common/errors/error-codes';
import {
  PaginationDto,
  SearchByNameDto,
  SearchByPlaceDto,
  SearchByCategoryDto,
  SearchIngredientDto
} from './dto/search-ingredient.dto';
import { CreateIngredientDto } from './dto/create-ingredient.dto';

@Injectable()
export class IngredientService {
  constructor(
    @InjectRepository(Ingredient)
    private ingredientRepository: Repository<Ingredient>,
    @InjectRepository(IngredientCategory)
    private categoryRepository: Repository<IngredientCategory>,
    @InjectRepository(Place)
    private placeRepository: Repository<Place>,
    @InjectRepository(DishesIngredients)
    private dishesIngredientsRepository: Repository<DishesIngredients>,
  ) {}

  /**
   * Lấy tất cả nguyên liệu
   */
  async findAll(): Promise<Ingredient[]> {
    return await this.ingredientRepository.find({
      relations: ['category', 'place'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Lấy tất cả địa điểm (places)
   */
  async findAllPlaces(): Promise<Place[]> {
    return await this.placeRepository.find({
      order: { name_place: 'ASC' },
    });
  }

  /**
   * Lấy nguyên liệu theo ID
   */
  async findOne(id: number): Promise<Ingredient> {
    const ingredient = await this.ingredientRepository.findOne({
      where: { id },
      relations: ['category', 'place'],
    });

    if (!ingredient) {
      throw new NotFoundException(ResponseMessageVi[ResponseCode.C00300]);
    }

    return ingredient;
  }

  /**
   * Lấy nguyên liệu theo danh sách ID
   */
  async findByIds(ids: number[]): Promise<Ingredient[]> {
    if (!ids || ids.length === 0) {
      return [];
    }

    return await this.ingredientRepository.find({
      where: { id: In(ids) },
      relations: ['category', 'place'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Tạo nguyên liệu mới
   */
  async create(createIngredientDto: CreateIngredientDto): Promise<Ingredient> {
    // Kiểm tra category_id nếu có
    if (createIngredientDto.category_id) {
      const category = await this.categoryRepository.findOne({
        where: { id: createIngredientDto.category_id },
      });
      if (!category) {
        throw new BadRequestException(ResponseMessageVi[ResponseCode.C00301]);
      }
    }

    // Kiểm tra place_id nếu có
    if (createIngredientDto.place_id) {
      const place = await this.placeRepository.findOne({
        where: { place_id: createIngredientDto.place_id },
      });
      if (!place) {
        throw new BadRequestException(ResponseMessageVi[ResponseCode.C00302]);
      }
    }

    // Tạo nguyên liệu mới
    const ingredient = this.ingredientRepository.create(createIngredientDto);
    const savedIngredient = await this.ingredientRepository.save(ingredient);

    // Lấy lại với relations
    const result = await this.ingredientRepository.findOne({
      where: { id: savedIngredient.id },
      relations: ['category', 'place'],
    });

    if (!result) {
      throw new NotFoundException('Không thể lấy lại nguyên liệu vừa tạo');
    }

    return result;
  }

  /**
   * Lấy tất cả nguyên liệu với phân trang
   */
  async findAllWithPagination(paginationDto: PaginationDto): Promise<{
    data: Ingredient[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.ingredientRepository.findAndCount({
      relations: ['category', 'place'],
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
   * Tìm kiếm nguyên liệu theo tên với phân trang
   */
  async searchByName(searchDto: SearchByNameDto): Promise<{
    data: Ingredient[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    searchTerm: string;
  }> {
    const { name = '', page = 1, limit = 10 } = searchDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.ingredientRepository
      .createQueryBuilder('ingredient')
      .leftJoinAndSelect('ingredient.category', 'category')
      .leftJoinAndSelect('ingredient.place', 'place')
      .orderBy('ingredient.created_at', 'DESC');

    if (name.trim()) {
      queryBuilder.where('ingredient.name LIKE :name', { name: `%${name.trim()}%` });
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
   * Tìm kiếm nguyên liệu theo địa chỉ với phân trang
   */
  async searchByPlace(searchDto: SearchByPlaceDto): Promise<{
    data: Ingredient[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    placeId: number;
  }> {
    const { place_id, page = 1, limit = 10 } = searchDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.ingredientRepository
      .createQueryBuilder('ingredient')
      .leftJoinAndSelect('ingredient.category', 'category')
      .leftJoinAndSelect('ingredient.place', 'place')
      .orderBy('ingredient.created_at', 'DESC');

    if (place_id) {
      queryBuilder.where('ingredient.place_id = :place_id', { place_id });
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
      placeId: place_id || 0,
    };
  }

  /**
   * Tìm kiếm nguyên liệu theo danh mục với phân trang
   */
  async searchByCategory(searchDto: SearchByCategoryDto): Promise<{
    data: Ingredient[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    categoryId: number;
  }> {
    const { category_id, page = 1, limit = 10 } = searchDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.ingredientRepository
      .createQueryBuilder('ingredient')
      .leftJoinAndSelect('ingredient.category', 'category')
      .leftJoinAndSelect('ingredient.place', 'place')
      .orderBy('ingredient.created_at', 'DESC');

    if (category_id) {
      queryBuilder.where('ingredient.category_id = :category_id', { category_id });
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
      categoryId: category_id || 0,
    };
  }

  /**
   * Tìm kiếm nguyên liệu với nhiều bộ lọc
   */
  async searchWithFilters(searchDto: SearchIngredientDto): Promise<{
    data: Ingredient[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    filters: {
      name?: string;
      place_id?: number;
      category_id?: number;
    };
  }> {
    const { name, place_id, category_id, page = 1, limit = 10 } = searchDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.ingredientRepository
      .createQueryBuilder('ingredient')
      .leftJoinAndSelect('ingredient.category', 'category')
      .leftJoinAndSelect('ingredient.place', 'place')
      .orderBy('ingredient.created_at', 'DESC');

    // Áp dụng các filter
    if (name && name.trim()) {
      queryBuilder.andWhere('ingredient.name LIKE :name', { name: `%${name.trim()}%` });
    }

    if (place_id) {
      queryBuilder.andWhere('ingredient.place_id = :place_id', { place_id });
    }

    if (category_id) {
      queryBuilder.andWhere('ingredient.category_id = :category_id', { category_id });
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
      filters: {
        name: name?.trim(),
        place_id,
        category_id,
      },
    };
  }

  /**
   * Lấy danh sách nguyên liệu theo dish_id từ bảng dishes_ingredients
   */
  async findIngredientsByDishId(dishId: number): Promise<DishesIngredients[]> {
    const ingredients = await this.dishesIngredientsRepository.find({
      where: { dish_id: dishId },
      order: { id: 'ASC' },
    });

    return ingredients;
  }

  /**
   * Tìm kiếm nguyên liệu thực tế dựa trên ingredient_name từ dishes_ingredients
   * JOIN với bảng ingredients để lấy thông tin chi tiết
   */
  async findIngredientsWithDetailsByDishId(dishId: number): Promise<any[]> {
    const dishIngredients = await this.dishesIngredientsRepository.find({
      where: { dish_id: dishId },
    });

    // Nếu không có nguyên liệu, trả về mảng rỗng
    if (dishIngredients.length === 0) {
      return [];
    }

    // Lấy danh sách tên nguyên liệu
    const ingredientNames = dishIngredients.map(di => di.ingredient_name);

    // Tìm các nguyên liệu thực tế trong bảng ingredients
    const ingredients = await this.ingredientRepository.find({
      where: { name: In(ingredientNames) },
      relations: ['category', 'place'],
    });

    // Map lại để kết hợp với quantity
    const result = dishIngredients.map(dishIngredient => {
      const matchedIngredient = ingredients.find(
        ing => ing.name === dishIngredient.ingredient_name
      );

      // Chỉ trả về ingredient nếu tìm thấy
      const resultItem: any = {
        id: dishIngredient.id,
        dish_id: dishIngredient.dish_id,
        ingredient_name: dishIngredient.ingredient_name,
        quantity: dishIngredient.quantity,
      };

      if (matchedIngredient) {
        resultItem.ingredient = matchedIngredient;
      }

      return resultItem;
    });

    return result;
  }
}
