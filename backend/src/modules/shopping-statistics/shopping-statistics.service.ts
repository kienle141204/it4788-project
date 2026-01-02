import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ShoppingList } from '../../entities/shopping-list.entity';
import { ShoppingItem } from '../../entities/shopping-item.entity';
import { Family } from '../../entities/family.entity';
import { FamilyMember } from '../../entities/family-member.entity';
import { FamilyService } from '../family/family.service';
import { MemberService } from '../member/member.service';
import type { JwtUser } from 'src/common/types/user.type';
import { ResponseCode, ResponseMessageVi } from 'src/common/errors/error-codes';

@Injectable()
export class ShoppingStatisticsService {
  constructor(
    @InjectRepository(ShoppingList)
    private readonly shoppingListRepo: Repository<ShoppingList>,
    @InjectRepository(ShoppingItem)
    private readonly shoppingItemRepo: Repository<ShoppingItem>,
    @InjectRepository(Family)
    private readonly familyRepo: Repository<Family>,
    @InjectRepository(FamilyMember)
    private readonly memberRepo: Repository<FamilyMember>,


    private readonly familyService: FamilyService,
    private readonly memberService: MemberService,
  ) { }

  private async checkFamilyPermission(familyId: number, user: JwtUser) {
    // Admin được phép tất cả
    if (user.role === 'admin') return true;

    // Lấy family (kèm owner)
    const family = await this.familyRepo.findOne({
      where: { id: familyId },
      relations: ['owner'],   // nếu bạn có relation "owner"
    });

    if (!family) {
      throw new ForbiddenException(ResponseMessageVi[ResponseCode.C00190]);
    }

    // Nếu user là owner
    if (family.owner_id === user.id) {
      return true;
    }

    // Kiểm tra xem user có phải là member
    const isMember = await this.memberRepo.exists({
      where: {
        family_id: familyId,
        user_id: user.id,
      },
    });

    if (isMember) return true;

    throw new ForbiddenException(ResponseMessageVi[ResponseCode.C00270]);
  }

  /** Tổng tiền theo từng tháng trong 1 năm */
  async totalCostByMonth(year: number, familyId: number, user: JwtUser) {
    await this.checkFamilyPermission(familyId, user);

    const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);

    const lists = await this.shoppingListRepo.find({
      where: {
        family_id: familyId,
        shopping_date: Between(startOfYear, endOfYear),
      },
      relations: ['items', 'items.ingredient'],
      order: { shopping_date: 'ASC' }
    });

    // Group by month
    const result = new Map<string, any>();

    lists.forEach(list => {
      const month = list.shopping_date.toISOString().slice(0, 7); // YYYY-MM

      if (!result.has(month)) {
        result.set(month, {
          month,
          total_cost: 0,
          shopping_lists: []
        });
      }

      const group = result.get(month);
      group.total_cost += Number(list.cost || 0);
      group.shopping_lists.push(list);
    });

    // Sort by month
    return Array.from(result.values())
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /** Số lượng item đã check của gia đình */
  async countCheckedItems(familyId: number, user: JwtUser) {
    await this.checkFamilyPermission(familyId, user);

    const [items, count] = await this.shoppingItemRepo.findAndCount({
      where: {
        shoppingList: { family_id: familyId },
        is_checked: true,
      },
      relations: ['ingredient', 'shoppingList']
    });

    return {
      total: count,
      items: items
    };
  }

  /** Top nguyên liệu mua nhiều nhất (theo stock) */
  async topIngredients(limit: number = 5, familyId: number, user: JwtUser) {
    await this.checkFamilyPermission(familyId, user);
    const items = await this.shoppingItemRepo.find({
      where: {
        shoppingList: { family_id: familyId },
        is_checked: true,
      },
      relations: ['ingredient', 'shoppingList']
    });

    const map = new Map<number, any>();

    for (const item of items) {
      if (!map.has(item.ingredient_id)) {
        map.set(item.ingredient_id, {
          ingredient_id: item.ingredient_id,
          ingredient_name: item.ingredient?.name,
          ingredient_image: item.ingredient?.image_url,
          total_quantity: 0,
          price: item.price ?? 0,
        });
      }

      const group = map.get(item.ingredient_id);
      group.total_quantity += item.stock ?? 0;
    }

    return [...map.values()]
      .sort((a, b) => b.total_quantity - a.total_quantity)
      .slice(0, limit);
  }

  /** Top nguyên liệu theo tổng tiền (stock * price) */
  async topIngredientsByCost(limit: number = 5, familyId: number, user: JwtUser) {
    const items = await this.shoppingItemRepo.find({
      where: {
        shoppingList: { family_id: familyId },
        is_checked: true,
      },
      relations: ['ingredient', 'shoppingList'],
    });

    const map = new Map<number, any>();

    for (const item of items) {
      if (!map.has(item.ingredient_id)) {
        map.set(item.ingredient_id, {
          ingredient_id: item.ingredient_id,
          ingredient_name: item.ingredient?.name,
          ingredient_image: item.ingredient?.image_url,
          total_cost: 0,
        });
      }

      const group = map.get(item.ingredient_id);

      // chỉ cộng price, không nhân stock
      group.total_cost += item.price ?? 0;
    }

    return [...map.values()]
      .sort((a, b) => b.total_cost - a.total_cost)
      .slice(0, limit);
  }

  /** Thống kê mua sắm theo User */
  async statisticsByUser(userId: number, user: JwtUser) {
    // Admin hoặc chính user đó mới được xem
    if (user.role !== 'admin' && user.id !== userId) {
      throw new ForbiddenException(ResponseMessageVi[ResponseCode.C00270]);
    }
    const lists = await this.shoppingListRepo.find({
      where: { owner_id: userId },
      select: ['cost']
    });
    const total_cost = lists.reduce((sum, list) => sum + Number(list.cost || 0), 0);

    const items = await this.shoppingItemRepo.find({
      where: {
        shoppingList: { owner_id: userId },
        is_checked: true
      },
      relations: ['ingredient', 'shoppingList']
    });

    return {
      total_cost,
      purchased_items: items,
    };
  }

  /** Thống kê mua sắm theo Family */
  async statisticsByFamily(familyId: number, user: JwtUser) {
    await this.checkFamilyPermission(familyId, user);

    const lists = await this.shoppingListRepo.find({
      where: { family_id: familyId },
      select: ['cost']
    });
    const total_cost = lists.reduce((sum, list) => sum + Number(list.cost || 0), 0);

    const items = await this.shoppingItemRepo.find({
      where: {
        shoppingList: { family_id: familyId },
        is_checked: true
      },
      relations: ['ingredient', 'shoppingList']
    });

    return {
      total_cost,
      purchased_items: items,
    };
  }
}
