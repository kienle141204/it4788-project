import { Injectable, NotFoundException, UnauthorizedException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShoppingItem } from '../../entities/shopping-item.entity';
import { CreateShoppingItemDto } from './dto/create-shopping-item.dto';
import { UpdateShoppingItemDto } from './dto/update-shopping-item.dto';
import { ShoppingList } from '../../entities/shopping-list.entity';
import { Ingredient } from '../../entities/ingredient.entity';
import type { JwtUser } from 'src/common/types/user.type';
import { ResponseCode, ResponseMessageVi } from 'src/common/errors/error-codes';
import { FamilyService } from '../family/family.service';
import { ShoppingListService } from '../shopping-list/shopping-list.service';
import { MemberService } from '../member/member.service';

@Injectable()
export class ShoppingItemService {
  constructor(
    @InjectRepository(ShoppingItem)
    private readonly shoppingItemRepo: Repository<ShoppingItem>,

    @InjectRepository(ShoppingList)
    private readonly shoppingListRepo: Repository<ShoppingList>,

    @InjectRepository(Ingredient)
    private readonly ingredientRepo: Repository<Ingredient>,

    private readonly familyService: FamilyService,

    @Inject(forwardRef(() => ShoppingListService))
    private readonly shoppingListService: ShoppingListService,

    private readonly memberService: MemberService,
  ) { }

  /** Tạo item mới */
  async create(dto: CreateShoppingItemDto, user: JwtUser): Promise<ShoppingItem> {
    const { list_id, ingredient_id } = dto;

    // Kiểm tra danh sách tồn tại
    const shoppingList = await this.shoppingListRepo.findOne({ where: { id: list_id } });
    if (!shoppingList) throw new NotFoundException(ResponseMessageVi[ResponseCode.C00260]);

    // Kiểm tra quyền: owner của list, admin, owner của family, manager của family, hoặc member nếu list được share
    const family = await this.familyService.getFamilyById(shoppingList.family_id);
    const isFamilyOwner = family && family.owner_id === user.id;
    const isListOwner = shoppingList.owner_id === user.id;
    const isAdmin = user.role === 'admin';

    // Kiểm tra user có phải là member của family không
    let isManager = false;
    let isMember = false;
    if (family) {
      const members = await this.memberService.getMembersByFamily(family.id);
      const currentMember = members.find(m => m.user_id === user.id);
      isManager = currentMember?.role === 'manager';
      isMember = !!currentMember; // member hoặc manager đều là member
    }

    // Cho phép nếu:
    // 1. Owner của shopping list
    // 2. Admin
    // 3. Owner của family
    // 4. Manager của family
    // 5. Member của family VÀ shopping list được share
    const hasPermission = isListOwner || isAdmin || isFamilyOwner || isManager || (isMember && shoppingList.is_shared);

    if (!hasPermission) {
      throw new UnauthorizedException(ResponseMessageVi[ResponseCode.C00341]);
    }

    // Kiểm tra ingredient tồn tại
    const ingredient = await this.ingredientRepo.findOne({ where: { id: ingredient_id } });
    if (!ingredient) throw new NotFoundException(ResponseMessageVi[ResponseCode.C00300]);

    // Auto-populate price from ingredient if not provided
    const itemData = { ...dto };
    if (itemData.price === null || itemData.price === undefined) {
      itemData.price = ingredient.price || 0;
    }

    // Tạo entity và lưu vào DB
    const item = this.shoppingItemRepo.create(itemData);
    const savedItem = await this.shoppingItemRepo.save(item);

    // Recalculate shopping list cost
    await this.shoppingListService.recalculateShoppingListCost(list_id);

    // Load relation
    const result = await this.shoppingItemRepo.findOne({
      where: { id: savedItem.id },
      relations: ['shoppingList', 'ingredient'],
    });

    if (!result) {
      throw new NotFoundException(ResponseMessageVi[ResponseCode.C00340]);
    }

    return result;
  }

  /** Lấy tất cả items */
  async findAll(): Promise<ShoppingItem[]> {
    return await this.shoppingItemRepo.find({
      relations: ['shoppingList', 'ingredient'],
      order: { created_at: 'DESC' },
    });
  }

  /** Lấy 1 item theo id với quyền truy cập */
  async findOne(id: number, user: JwtUser): Promise<ShoppingItem> {
    // Lấy item và relation
    const item = await this.shoppingItemRepo.findOne({
      where: { id },
      relations: ['shoppingList', 'ingredient'],
    });

    if (!item) throw new NotFoundException(ResponseMessageVi[ResponseCode.C00340]);

    const shoppingList = item.shoppingList;
    if (!shoppingList) throw new NotFoundException(ResponseMessageVi[ResponseCode.C00260]);

    // Kiểm tra quyền: owner của list, admin, owner của family, manager của family, hoặc member nếu list được share
    const family = await this.familyService.getFamilyById(shoppingList.family_id);
    const isFamilyOwner = family && family.owner_id === user.id;
    const isListOwner = shoppingList.owner_id === user.id;
    const isAdmin = user.role === 'admin';

    // Kiểm tra user có phải là member của family không
    let isManager = false;
    let isMember = false;
    if (family) {
      const members = await this.memberService.getMembersByFamily(family.id);
      const currentMember = members.find(m => m.user_id === user.id);
      isManager = currentMember?.role === 'manager';
      isMember = !!currentMember; // member hoặc manager đều là member
    }

    // Cho phép nếu:
    // 1. Owner của shopping list
    // 2. Admin
    // 3. Owner của family
    // 4. Manager của family
    // 5. Member của family VÀ shopping list được share
    const hasPermission = isListOwner || isAdmin || isFamilyOwner || isManager || (isMember && shoppingList.is_shared);

    if (!hasPermission) {
      throw new UnauthorizedException(ResponseMessageVi[ResponseCode.C00342]);
    }

    return item;
  }

  /** Cập nhật item */
  async update(id: number, dto: UpdateShoppingItemDto, user: JwtUser): Promise<ShoppingItem> {
    const item = await this.findOne(id, user);
    const oldListId = item.list_id;

    // Nếu có truyền lại list_id hay ingredient_id thì cập nhật đúng quan hệ
    if (dto.list_id) {
      const list = await this.shoppingListRepo.findOne({ where: { id: dto.list_id } });
      if (!list) throw new NotFoundException(ResponseMessageVi[ResponseCode.C00260]);
      item.shoppingList = list;
    }

    if (dto.ingredient_id) {
      const ingredient = await this.ingredientRepo.findOne({ where: { id: dto.ingredient_id } });
      if (!ingredient) throw new NotFoundException(ResponseMessageVi[ResponseCode.C00300]);
      item.ingredient = ingredient;
    }

    Object.assign(item, dto);
    const updatedItem = await this.shoppingItemRepo.save(item);

    // Recalculate cost for both old and new list (if list changed)
    await this.shoppingListService.recalculateShoppingListCost(updatedItem.list_id);
    if (dto.list_id && dto.list_id !== oldListId) {
      await this.shoppingListService.recalculateShoppingListCost(oldListId);
    }

    return updatedItem;
  }

  // Check/uncheck item (toggle)
  async check(id: number, user: JwtUser): Promise<ShoppingItem> {
    const item = await this.findOne(id, user);

    // Đảo ngược trạng thái is_checked
    item.is_checked = !item.is_checked;

    // Cập nhật item
    const updatedItem = await this.shoppingItemRepo.save(item);

    // Note: Cost is always calculated from all items regardless of checked status
    // If you want to only count checked items, modify recalculateShoppingListCost method

    return updatedItem;
  }

  /** Xóa item */
  async remove(id: number, user: JwtUser): Promise<void> {
    const item = await this.findOne(id, user);
    const listId = item.list_id;
    await this.shoppingItemRepo.remove(item);

    // Recalculate shopping list cost after removal
    await this.shoppingListService.recalculateShoppingListCost(listId);
  }
}
