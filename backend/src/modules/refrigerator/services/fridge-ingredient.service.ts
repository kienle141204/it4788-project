import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FridgeIngredient } from '../../../entities/fridge-ingredient.entity';
import { Refrigerator } from '../../../entities/refrigerator.entity';
import { Ingredient } from '../../../entities/ingredient.entity';
import { CreateFridgeIngredientDto } from '../dto/create-fridge-ingredient.dto';
import { UpdateFridgeIngredientDto } from '../dto/update-fridge-ingredient.dto';
import { JwtUser } from '../../../common/types/user.type';

@Injectable()
export class FridgeIngredientService {
  constructor(
    @InjectRepository(FridgeIngredient)
    private readonly fridgeIngredientRepo: Repository<FridgeIngredient>,

    @InjectRepository(Refrigerator)
    private readonly refrigeratorRepo: Repository<Refrigerator>,

    @InjectRepository(Ingredient)
    private readonly ingredientRepo: Repository<Ingredient>,
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
    if (!fridge) throw new NotFoundException(`Không tìm thấy refrigerator ${refrigerator_id}`);

    // Kiểm tra quyền: admin, owner, family owner, hoặc member trong family
    const isOwner = fridge.owner_id === user.id;
    const isAdmin = user.role === 'admin';
    const isFamilyOwner = fridge.family?.owner_id === user.id;
    const isFamilyMember = fridge.family?.members?.some(member => member.id === user.id) ?? false;

    if (!isOwner && !isAdmin && !isFamilyOwner && !isFamilyMember) {
      throw new UnauthorizedException(
        'Bạn không có quyền thêm nguyên liệu vào tủ lạnh này'
      );
    }

    // Kiểm tra nguyên liệu tồn tại
    const ingredient = await this.ingredientRepo.findOne({ where: { id: ingredient_id } });
    if (!ingredient) throw new NotFoundException(`Không tìm thấy nguyên liệu ${ingredient_id}`);

    // Tạo FridgeIngredient
    const fridgeIngredient = this.fridgeIngredientRepo.create({
      refrigerator_id,
      ingredient_id,
      ...data,
    });

    return await this.fridgeIngredientRepo.save(fridgeIngredient);
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
    if (!item) throw new NotFoundException(`FridgeIngredient ${id} not found`);

    const fridge = item.refrigerator;
    const isOwner = fridge.owner_id === user.id;
    const isAdmin = user.role === 'admin';
    const isFamilyOwner = fridge.family?.owner_id === user.id;
    const isFamilyMember = fridge.family?.members?.some(m => m.id === user.id) ?? false;

    if (!isOwner && !isAdmin && !isFamilyOwner && !isFamilyMember) {
      throw new UnauthorizedException('Bạn không có quyền truy cập nguyên liệu này');
    }

    return item;
  }

  /** Lấy tất cả nguyên liệu trong tủ lạnh */
  async findByRefrigerator(fridge_id: number, user: JwtUser): Promise<FridgeIngredient[]> {
    const items = await this.fridgeIngredientRepo.find({
      where: { refrigerator_id: fridge_id },
      relations: ['refrigerator', 'ingredient', 'refrigerator.family', 'refrigerator.family.members'],
    });

    if (!items.length) throw new NotFoundException(`Không tìm thấy nguyên liệu trong tủ lạnh`);

    const fridge = items[0].refrigerator;
    const isOwner = fridge.owner_id === user.id;
    const isAdmin = user.role === 'admin';
    const isFamilyOwner = fridge.family?.owner_id === user.id;
    const isFamilyMember = fridge.family?.members?.some(m => m.id === user.id) ?? false;

    if (!isOwner && !isAdmin && !isFamilyOwner && !isFamilyMember) {
      throw new UnauthorizedException('Bạn không có quyền truy cập nguyên liệu này');
    }

    return items;
  }

  /** Cập nhật nguyên liệu */
  async update(id: number, dto: UpdateFridgeIngredientDto, user: JwtUser): Promise<FridgeIngredient> {
    const item = await this.findOne(id, user); // đã check quyền
    Object.assign(item, dto);
    return await this.fridgeIngredientRepo.save(item);
  }

  /** Xóa nguyên liệu khỏi tủ */
  async remove(id: number, user: JwtUser): Promise<void> {
    const item = await this.findOne(id, user); // đã check quyền
    await this.fridgeIngredientRepo.remove(item);
  }
}
