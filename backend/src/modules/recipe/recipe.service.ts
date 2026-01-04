import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, In } from 'typeorm';
import { Recipe } from '../../entities/recipe.entity';
import { RecipeStep } from '../../entities/recipe-step.entity';
import { Image } from '../../entities/image.entity';
import { Dish } from '../../entities/dish.entity';
import { User } from '../../entities/user.entity';
import { GetRecipesDto } from './dto/get-recipes.dto';
import { CreateRecipeDto, UpdateRecipeDto } from './dto/create-recipe.dto';
import { ResponseCode, ResponseMessageVi } from 'src/common/errors/error-codes';

@Injectable()
export class RecipeService {
  constructor(
    @InjectRepository(Recipe)
    private recipeRepository: Repository<Recipe>,
    @InjectRepository(RecipeStep)
    private recipeStepRepository: Repository<RecipeStep>,
    @InjectRepository(Image)
    private imageRepository: Repository<Image>,
    @InjectRepository(Dish)
    private dishRepository: Repository<Dish>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  /**
   * Lấy tất cả công thức với phân trang và filter (public recipes visible to all, private recipes only to owner or admin)
   */
  async findAllWithPagination(getRecipesDto: GetRecipesDto, user: User): Promise<{
    data: Recipe[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, dishId, ownerId } = getRecipesDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.recipeRepository
      .createQueryBuilder('recipe')
      .leftJoinAndSelect('recipe.dish', 'dish')
      .leftJoinAndSelect('recipe.owner', 'owner')
      .orderBy('recipe.created_at', 'DESC');

    // Admin có thể xem tất cả, user chỉ xem public recipes hoặc private recipes của chính họ
    if (user.role !== 'admin') {
      queryBuilder.where(
        new Brackets((qb) => {
          qb.where('recipe.status = :publicStatus', { publicStatus: 'public' })
            .orWhere('(recipe.status = :privateStatus AND recipe.owner_id = :userId)', {
              privateStatus: 'private',
              userId: user.id
            });
        })
      );
    }

    if (dishId) {
      queryBuilder.andWhere('recipe.dish_id = :dishId', { dishId });
    }

    if (ownerId) {
      queryBuilder.andWhere('recipe.owner_id = :ownerId', { ownerId });
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
    };
  }

  /**
   * Lấy công thức theo ID với đầy đủ thông tin (public recipes visible to all, private recipes only to owner or admin)
   */
  async findOneWithDetails(id: number, user: User): Promise<Recipe> {
    const recipe = await this.recipeRepository.findOne({
      where: { id },
      relations: ['dish', 'owner', 'steps'],
    });

    if (!recipe) {
      throw new NotFoundException(ResponseMessageVi[ResponseCode.C00110]);
    }

    // Kiểm tra quyền truy cập: admin có thể xem tất cả, user chỉ xem public recipes hoặc private recipes của chính họ
    if (user.role !== 'admin' && recipe.status === 'private' && recipe.owner_id !== user.id) {
      throw new ForbiddenException(ResponseMessageVi[ResponseCode.C00117]);
    }

    // Lấy các bước chi tiết với hình ảnh
    const steps = await this.recipeStepRepository.find({
      where: { recipe_id: id },
      relations: ['images'],
      order: { step_number: 'ASC' },
    });

    recipe.steps = steps;

    return recipe;
  }

  /**
   * Lấy công thức theo món ăn
   * - Admin: xem tất cả công thức (public và private)
   * - User: xem tất cả công thức public và công thức private của chính họ
   */
  async findByDishId(dishId: number, user: User): Promise<Recipe[]> {
    // Kiểm tra món ăn có tồn tại không
    const dish = await this.dishRepository.findOne({ where: { id: dishId } });
    if (!dish) {
      throw new NotFoundException(ResponseMessageVi[ResponseCode.C00100]);
    }

    const queryBuilder = this.recipeRepository
      .createQueryBuilder('recipe')
      .leftJoinAndSelect('recipe.dish', 'dish')
      .leftJoinAndSelect('recipe.owner', 'owner')
      .leftJoinAndSelect('recipe.steps', 'steps')
      .leftJoinAndSelect('steps.images', 'images')
      .where('recipe.dish_id = :dishId', { dishId })
      .orderBy('recipe.created_at', 'DESC')
      .addOrderBy('steps.step_number', 'ASC');

    // Admin có thể xem tất cả, user xem public recipes hoặc private recipes của chính họ
    if (user.role !== 'admin') {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('recipe.status = :publicStatus', { publicStatus: 'public' })
            .orWhere('(recipe.status = :privateStatus AND recipe.owner_id = :userId)', {
              privateStatus: 'private',
              userId: user.id
            });
        })
      );
    }

    return await queryBuilder.getMany();
  }

  /**
   * Lấy công thức của user
   */
  async findByOwnerId(ownerId: number): Promise<Recipe[]> {
    // Kiểm tra user có tồn tại không
    const user = await this.userRepository.findOne({ where: { id: ownerId } });
    if (!user) {
      throw new NotFoundException(ResponseMessageVi[ResponseCode.C00052]);
    }

    return await this.recipeRepository.find({
      where: { owner_id: ownerId },
      relations: ['dish', 'owner', 'steps'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Lấy công thức phổ biến (có nhiều bước nhất) - public recipes visible to all, private recipes only to owner or admin
   */
  async getPopularRecipes(limit: number = 10, user: User): Promise<Recipe[]> {
    const queryBuilder = this.recipeRepository
      .createQueryBuilder('recipe')
      .leftJoinAndSelect('recipe.dish', 'dish')
      .leftJoinAndSelect('recipe.owner', 'owner')
      .leftJoin('recipe.steps', 'steps')
      .addSelect('COUNT(steps.id)', 'stepCount')
      .groupBy('recipe.id')
      .orderBy('stepCount', 'DESC')
      .addOrderBy('recipe.created_at', 'DESC')
      .limit(limit);

    // Admin có thể xem tất cả, user chỉ xem public recipes hoặc private recipes của chính họ
    if (user.role !== 'admin') {
      queryBuilder.where(
        new Brackets((qb) => {
          qb.where('recipe.status = :publicStatus', { publicStatus: 'public' })
            .orWhere('(recipe.status = :privateStatus AND recipe.owner_id = :userId)', {
              privateStatus: 'private',
              userId: user.id
            });
        })
      );
    }

    return await queryBuilder.getMany();
  }

  /**
   * Tạo công thức mới
   */
  async createRecipe(createRecipeDto: CreateRecipeDto, userId: number): Promise<Recipe> {
    const { dish_id, status = 'public', steps } = createRecipeDto;

    // Kiểm tra món ăn có tồn tại không
    const dish = await this.dishRepository.findOne({ where: { id: dish_id } });
    if (!dish) {
      throw new NotFoundException(ResponseMessageVi[ResponseCode.C00100]);
    }

    // Kiểm tra user đã tạo công thức cho món ăn này chưa
    const existingRecipe = await this.recipeRepository.findOne({
      where: { dish_id, owner_id: userId },
    });

    if (existingRecipe) {
      throw new ConflictException(ResponseMessageVi[ResponseCode.C00116]);
    }

    // Tạo công thức mới
    const recipe = this.recipeRepository.create({
      dish_id,
      owner_id: userId,
      status,
    });

    const savedRecipe = await this.recipeRepository.save(recipe);

    // Tạo các bước nấu ăn
    const recipeSteps = steps.map(step =>
      this.recipeStepRepository.create({
        recipe_id: savedRecipe.id,
        step_number: step.step_number,
        description: step.description,
      })
    );

    await this.recipeStepRepository.save(recipeSteps);

    // Trả về công thức với đầy đủ thông tin
    return await this.findOneWithDetails(savedRecipe.id, { id: userId, role: 'user' } as User);
  }

  /**
   * Cập nhật công thức
   */
  async updateRecipe(recipeId: number, updateRecipeDto: UpdateRecipeDto, userId: number, userRole?: string): Promise<Recipe> {
    // Tìm công thức
    const recipe = await this.recipeRepository.findOne({
      where: { id: recipeId },
      relations: ['owner'],
    });

    if (!recipe) {
      throw new NotFoundException(ResponseMessageVi[ResponseCode.C00110]);
    }

    // Kiểm tra quyền sở hữu (admin có thể sửa bất kỳ công thức nào)
    if (userRole !== 'admin' && recipe.owner_id !== userId) {
      throw new ForbiddenException(ResponseMessageVi[ResponseCode.C00117]);
    }

    // Cập nhật status nếu có
    if (updateRecipeDto.status) {
      await this.recipeRepository.update(recipeId, { status: updateRecipeDto.status });
    }

    // Lấy danh sách step IDs hiện tại
    const existingSteps = await this.recipeStepRepository.find({
      where: { recipe_id: recipeId },
    });
    // Chuyển đổi ID sang number để so sánh chính xác
    const existingStepIds = existingSteps.map(step => Number(step.id));

    // Phân loại steps từ request
    const stepsToUpdate = updateRecipeDto.steps.filter(step => step.id !== undefined && step.id !== null);
    const stepsToCreate = updateRecipeDto.steps.filter(step => step.id === undefined || step.id === null);

    // Chuyển đổi ID từ request sang number và chỉ giữ những ID thực sự tồn tại trong database
    const stepIdsToKeep = stepsToUpdate
      .map(step => Number(step.id))
      .filter(id => existingStepIds.includes(id));

    // Tìm steps cần xóa (không có trong danh sách update)
    const stepIdsToDelete = existingStepIds.filter(id => !stepIdsToKeep.includes(id));

    // Xóa images của các steps sẽ bị xóa
    if (stepIdsToDelete.length > 0) {
      await this.imageRepository.delete({ recipe_steps_id: In(stepIdsToDelete) });
      // Xóa các steps cũ không còn dùng
      await this.recipeStepRepository.delete({ id: In(stepIdsToDelete) });
    }

    // Cập nhật các steps hiện có (giữ nguyên images)
    for (const step of stepsToUpdate) {
      const stepId = Number(step.id);
      // Chỉ update nếu step ID tồn tại trong database
      if (existingStepIds.includes(stepId)) {
        await this.recipeStepRepository.update(stepId, {
          step_number: step.step_number,
          description: step.description || '',
        });
      } else {
        // Nếu ID không tồn tại, tạo mới step
        const newStep = this.recipeStepRepository.create({
          recipe_id: recipeId,
          step_number: step.step_number,
          description: step.description || '',
        });
        await this.recipeStepRepository.save(newStep);
      }
    }

    // Tạo các bước mới
    if (stepsToCreate.length > 0) {
      const newSteps = stepsToCreate.map(step =>
        this.recipeStepRepository.create({
          recipe_id: recipeId,
          step_number: step.step_number,
          description: step.description || '',
        })
      );
      await this.recipeStepRepository.save(newSteps);
    }

    // Trả về công thức đã cập nhật
    return await this.findOneWithDetails(recipeId, { id: userId, role: 'user' } as User);
  }

  /**
   * Xóa công thức
   */
  async deleteRecipe(recipeId: number, userId: number, userRole?: string): Promise<void> {
    // Tìm công thức
    const recipe = await this.recipeRepository.findOne({
      where: { id: recipeId },
    });

    if (!recipe) {
      throw new NotFoundException(ResponseMessageVi[ResponseCode.C00110]);
    }

    // Kiểm tra quyền sở hữu (admin có thể xóa bất kỳ công thức nào)
    if (userRole !== 'admin' && recipe.owner_id !== userId) {
      throw new ForbiddenException(ResponseMessageVi[ResponseCode.C00118]);
    }

    // Lấy danh sách các bước của công thức
    const steps = await this.recipeStepRepository.find({
      where: { recipe_id: recipeId },
    });

    // Nếu có các bước, xóa images và steps trước
    if (steps.length > 0) {
      const stepIds = steps.map(step => step.id);

      // Xóa tất cả images liên quan đến các bước
      await this.imageRepository.delete({ recipe_steps_id: In(stepIds) });

      // Xóa tất cả các bước của công thức
      await this.recipeStepRepository.delete({ recipe_id: recipeId });
    }

    // Cuối cùng xóa công thức
    await this.recipeRepository.delete(recipeId);
  }
}