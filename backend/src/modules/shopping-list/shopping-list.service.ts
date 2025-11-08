import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShoppingList } from '../../entities/shopping-list.entity';
import { CreateShoppingListDto } from './dto/create-shopping-list.dto';
import { UpdateShoppingListDto } from './dto/update-shopping-list.dto';
import { ShoppingItem } from '../../entities/shopping-item.entity';

@Injectable()
export class ShoppingListService {
  constructor(
    @InjectRepository(ShoppingList)
    private readonly shoppingListRepo: Repository<ShoppingList>,

    @InjectRepository(ShoppingItem)
    private readonly shoppingItemRepo: Repository<ShoppingItem>,
  ) { }

  /** Tạo mới Shopping List (có thể kèm danh sách items) */
  async create(createShoppingListDto: CreateShoppingListDto): Promise<ShoppingList> {
    const { items, ...listData } = createShoppingListDto;

    const newList = this.shoppingListRepo.create({
      ...listData,
      items: items?.map((i) => this.shoppingItemRepo.create(i)) || [],
    });

    return await this.shoppingListRepo.save(newList);
  }

  /** Lấy toàn bộ danh sách (kèm owner, family, items) */
  async findAll(): Promise<ShoppingList[]> {
    return await this.shoppingListRepo.find({
      relations: ['owner', 'family', 'items', 'items.ingredient'],
      order: { created_at: 'DESC' },
    });
  }

  /** Lấy 1 danh sách theo id */
  async findOne(id: number): Promise<ShoppingList> {
    const list = await this.shoppingListRepo.findOne({
      where: { id },
      relations: ['owner', 'family', 'items', 'items.ingredient'],
    });

    if (!list) {
      throw new NotFoundException(`Shopping list with ID ${id} not found`);
    }
    return list;
  }

  /** Cập nhật danh sách */
  async update(id: number, updateDto: UpdateShoppingListDto): Promise<ShoppingList> {
    const list = await this.findOne(id);

    Object.assign(list, updateDto);
    return await this.shoppingListRepo.save(list);
  }

  /** Xóa danh sách */
  async remove(id: number): Promise<void> {
    const list = await this.findOne(id);
    await this.shoppingListRepo.remove(list);
  }
}
