import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShoppingItem } from '../../entities/shopping-item.entity';
import { CreateShoppingItemDto } from './dto/create-shopping-item.dto';
import { UpdateShoppingItemDto } from './dto/update-shopping-item.dto';
import { ShoppingList } from '../../entities/shopping-list.entity';
import { Ingredient } from '../../entities/ingredient.entity';

@Injectable()
export class ShoppingItemService {
  constructor(
    @InjectRepository(ShoppingItem)
    private readonly shoppingItemRepo: Repository<ShoppingItem>,

    @InjectRepository(ShoppingList)
    private readonly shoppingListRepo: Repository<ShoppingList>,

    @InjectRepository(Ingredient)
    private readonly ingredientRepo: Repository<Ingredient>,
  ) { }

  /** 🟢 Tạo item mới */
  async create(dto: CreateShoppingItemDto): Promise<ShoppingItem> {
    const { list_id, ingredient_id, ...data } = dto;

    // Kiểm tra danh sách tồn tại
    const shoppingList = await this.shoppingListRepo.findOne({ where: { id: list_id } });
    if (!shoppingList) throw new NotFoundException(`ShoppingList ${list_id} not found`);

    // Kiểm tra ingredient tồn tại
    const ingredient = await this.ingredientRepo.findOne({ where: { id: ingredient_id } });
    if (!ingredient) throw new NotFoundException(`Ingredient ${ingredient_id} not found`);

    const item = this.shoppingItemRepo.create({
      ...data,
      shoppingList,
      ingredient,
    });

    return await this.shoppingItemRepo.save(item);
  }

  /** 🟡 Lấy tất cả items */
  async findAll(): Promise<ShoppingItem[]> {
    return await this.shoppingItemRepo.find({
      relations: ['shoppingList', 'ingredient'],
      order: { created_at: 'DESC' },
    });
  }

  /** 🔵 Lấy 1 item theo id */
  async findOne(id: number): Promise<ShoppingItem> {
    const item = await this.shoppingItemRepo.findOne({
      where: { id },
      relations: ['shoppingList', 'ingredient'],
    });
    if (!item) throw new NotFoundException(`ShoppingItem ${id} not found`);
    return item;
  }

  /** 🟣 Cập nhật item */
  async update(id: number, dto: UpdateShoppingItemDto): Promise<ShoppingItem> {
    const item = await this.findOne(id);

    // Nếu có truyền lại list_id hay ingredient_id thì cập nhật đúng quan hệ
    if (dto.list_id) {
      const list = await this.shoppingListRepo.findOne({ where: { id: dto.list_id } });
      if (!list) throw new NotFoundException(`ShoppingList ${dto.list_id} not found`);
      item.shoppingList = list;
    }

    if (dto.ingredient_id) {
      const ingredient = await this.ingredientRepo.findOne({ where: { id: dto.ingredient_id } });
      if (!ingredient) throw new NotFoundException(`Ingredient ${dto.ingredient_id} not found`);
      item.ingredient = ingredient;
    }

    Object.assign(item, dto);
    return await this.shoppingItemRepo.save(item);
  }

  /** 🔴 Xóa item */
  async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.shoppingItemRepo.remove(item);
  }
}
