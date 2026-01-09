import { Injectable, NotFoundException, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { ResponseCode, ResponseMessageVi } from 'src/common/errors/error-codes';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FridgeIngredient } from '../../../entities/fridge-ingredient.entity';
import { Refrigerator } from '../../../entities/refrigerator.entity';
import { Ingredient } from '../../../entities/ingredient.entity';
import { CreateFridgeIngredientDto } from '../dto/create-fridge-ingredient.dto';
import { UpdateFridgeIngredientDto } from '../dto/update-fridge-ingredient.dto';
import { PaginationDto } from '../dto/pagination.dto';
import { JwtUser } from '../../../common/types/user.type';
import { RefrigeratorGateway } from '../refrigerator.gateway';

@Injectable()
export class FridgeIngredientService {
  constructor(
    @InjectRepository(FridgeIngredient)
    private readonly fridgeIngredientRepo: Repository<FridgeIngredient>,

    @InjectRepository(Refrigerator)
    private readonly refrigeratorRepo: Repository<Refrigerator>,

    @InjectRepository(Ingredient)
    private readonly ingredientRepo: Repository<Ingredient>,

    @Inject(forwardRef(() => RefrigeratorGateway))
    private readonly refrigeratorGateway: RefrigeratorGateway,
  ) { }

  /** Tạo mới nguyên liệu trong tủ lạnh */
  async create(
    refrigerator_id: number,
    dto: CreateFridgeIngredientDto,
    user: JwtUser
  ): Promise<FridgeIngredient> {
    const { ingredient_id, ...data } = dto;

    // Kiểm tra refrigerator tồn tại và load owner + family + members
    const fridge = await this.refrigeratorRepo.findOne({
      where: { id: refrigerator_id },
      relations: ['owner', 'family', 'family.members'],
    });
    if (!fridge) throw new NotFoundException(ResponseMessageVi[ResponseCode.C00230]);

    // Kiểm tra quyền: admin, owner, family owner, hoặc member trong family
    const isOwner = fridge.owner_id === user.id;
    const isAdmin = user.role === 'admin';
    const isFamilyOwner = fridge.family?.owner_id === user.id;
    const isFamilyMember = fridge.family?.members?.some(member => member.user_id === user.id) ?? false;

    if (!isOwner && !isAdmin && !isFamilyOwner && !isFamilyMember) {
      throw new UnauthorizedException(
        'Bạn không có quyền thêm nguyên liệu vào tủ lạnh này'
      );
    }

    // Kiểm tra nguyên liệu tồn tại
    const ingredient = await this.ingredientRepo.findOne({ where: { id: ingredient_id } });
    if (!ingredient) throw new NotFoundException(ResponseMessageVi[ResponseCode.C00236]);

    // Tạo FridgeIngredient
    const fridgeIngredient = this.fridgeIngredientRepo.create({
      refrigerator_id,
      ingredient_id,
      ...data,
    });

    const savedIngredient = await this.fridgeIngredientRepo.save(fridgeIngredient);

    // Emit WebSocket event to family members
    try {
      await this.refrigeratorGateway.emitIngredientAdded(refrigerator_id, savedIngredient, user.id);
    } catch (error) {
      console.error('Error emitting ingredient added event:', error);
    }

    return savedIngredient;
  }

  /** Lấy toàn bộ nguyên liệu trong tủ lạnh */
  async findAll(): Promise<FridgeIngredient[]> {
    return this.fridgeIngredientRepo.find({
      relations: ['refrigerator', 'ingredient'],
      order: { created_at: 'DESC' },
    });
  }

  /** Lấy chi tiết một nguyên liệu */
  async findOne(id: number, user: JwtUser): Promise<FridgeIngredient> {
    const item = await this.fridgeIngredientRepo.findOne({
      where: { id },
      relations: ['refrigerator', 'ingredient', 'refrigerator.family', 'refrigerator.family.members'],
    });
    if (!item) throw new NotFoundException(ResponseMessageVi[ResponseCode.C00238]);

    const fridge = item.refrigerator;
    const isOwner = fridge.owner_id === user.id;
    const isAdmin = user.role === 'admin';
    const isFamilyOwner = fridge.family?.owner_id === user.id;
    const isFamilyMember = fridge.family?.members?.some(m => m.user_id === user.id) ?? false;

    if (!isOwner && !isAdmin && !isFamilyOwner && !isFamilyMember) {
      throw new UnauthorizedException(ResponseMessageVi[ResponseCode.C00234]);
    }

    return item;
  }

  /** Lấy tất cả nguyên liệu trong tủ lạnh với phân trang */
  async findByRefrigerator(fridge_id: number, user: JwtUser, paginationDto: PaginationDto): Promise<{
    data: FridgeIngredient[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Kiểm tra quyền truy cập tủ lạnh
    const fridge = await this.refrigeratorRepo.findOne({
      where: { id: fridge_id },
      relations: ['owner', 'family', 'family.members'],
    });

    if (!fridge) throw new NotFoundException(ResponseMessageVi[ResponseCode.C00230]);

    const isOwner = fridge.owner_id === user.id;
    const isAdmin = user.role === 'admin';
    const isFamilyOwner = fridge.family?.owner_id === user.id;
    const isFamilyMember = fridge.family?.members?.some(m => m.user_id === user.id) ?? false;

    if (!isOwner && !isAdmin && !isFamilyOwner && !isFamilyMember) {
      throw new UnauthorizedException(ResponseMessageVi[ResponseCode.C00234]);
    }

    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.fridgeIngredientRepo.findAndCount({
      where: { refrigerator_id: fridge_id },
      relations: ['refrigerator', 'ingredient', 'refrigerator.family', 'refrigerator.family.members'],
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

  /** Cập nhật nguyên liệu */
  async update(id: number, dto: UpdateFridgeIngredientDto, user: JwtUser): Promise<FridgeIngredient> {
    const item = await this.findOne(id, user); // đã check quyền
    const refrigeratorId = item.refrigerator_id;
    Object.assign(item, dto);
    const savedItem = await this.fridgeIngredientRepo.save(item);

    // Emit WebSocket event to family members
    try {
      await this.refrigeratorGateway.emitIngredientUpdated(refrigeratorId, savedItem, user.id);
    } catch (error) {
      console.error('Error emitting ingredient updated event:', error);
    }

    return savedItem;
  }

  /** Xóa nguyên liệu khỏi tủ */
  async remove(id: number, user: JwtUser): Promise<void> {
    const item = await this.findOne(id, user); // đã check quyền
    const refrigeratorId = item.refrigerator_id;
    const ingredientId = item.id;

    await this.fridgeIngredientRepo.remove(item);

    // Emit WebSocket event to family members
    try {
      await this.refrigeratorGateway.emitIngredientDeleted(refrigeratorId, ingredientId, user.id);
    } catch (error) {
      console.error('Error emitting ingredient deleted event:', error);
    }
  }
}
