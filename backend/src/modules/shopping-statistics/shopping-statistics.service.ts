import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShoppingList } from '../../entities/shopping-list.entity';
import { ShoppingItem } from '../../entities/shopping-item.entity';
import { Family } from '../../entities/family.entity';
import { FamilyMember } from '../../entities/family-member.entity';
import { FamilyService } from '../family/family.service';
import { MemberService } from '../member/member.service';
import type { JwtUser } from 'src/common/types/user.type';

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
      throw new ForbiddenException('Family not found');
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

    throw new ForbiddenException(
      'Bạn không có quyền truy cập thống kê của gia đình này',
    );
  }

  /** Tổng tiền theo từng tháng trong 1 năm */
  async totalCostByMonth(year: number, familyId: number, user: JwtUser) {
    await this.checkFamilyPermission(familyId, user);
    return await this.shoppingListRepo
      .createQueryBuilder('list')
      .select("DATE_FORMAT(list.shopping_date, '%Y-%m')", 'month')
      .addSelect('SUM(list.cost)', 'total_cost')
      .where('list.family_id = :familyId', { familyId })
      .andWhere('YEAR(list.shopping_date) = :year', { year })
      .groupBy("DATE_FORMAT(list.shopping_date, '%Y-%m')")
      .orderBy("DATE_FORMAT(list.shopping_date, '%Y-%m')", 'ASC')
      .getRawMany();
  }

  /** Số lượng item đã check của gia đình */
  async countCheckedItems(familyId: number, user: JwtUser) {
    await this.checkFamilyPermission(familyId, user);
    return await this.shoppingItemRepo
      .createQueryBuilder('item')
      .innerJoin(ShoppingList, 'list', 'list.id = item.list_id')
      .where('list.family_id = :familyId', { familyId })
      .andWhere('item.is_checked = true')
      .getCount();
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
      throw new ForbiddenException('Bạn không có quyền truy cập thống kê này');
    }
    const totalCost = await this.shoppingListRepo
      .createQueryBuilder('list')
      .select('SUM(list.cost)', 'total_cost')
      .where('list.owner_id = :userId', { userId })
      .getRawOne();

    const totalItems = await this.shoppingItemRepo
      .createQueryBuilder('item')
      .innerJoin(ShoppingList, 'list', 'list.id = item.list_id')
      .where('list.owner_id = :userId', { userId })
      .getCount();

    const checkedItems = await this.shoppingItemRepo
      .createQueryBuilder('item')
      .innerJoin(ShoppingList, 'list', 'list.id = item.list_id')
      .where('list.owner_id = :userId', { userId })
      .andWhere('item.is_checked = true')
      .getCount();

    return {
      total_cost: Number(totalCost.total_cost || 0),
      total_items: totalItems,
      checked_items: checkedItems,
    };
  }

  /** Thống kê mua sắm theo Family */
  async statisticsByFamily(familyId: number, user: JwtUser) {
    await this.checkFamilyPermission(familyId, user);
    const totalCost = await this.shoppingListRepo
      .createQueryBuilder('list')
      .select('SUM(list.cost)', 'total_cost')
      .where('list.family_id = :familyId', { familyId })
      .getRawOne();

    const totalItems = await this.shoppingItemRepo
      .createQueryBuilder('item')
      .innerJoin(ShoppingList, 'list', 'list.id = item.list_id')
      .where('list.family_id = :familyId', { familyId })
      .getCount();

    const checkedItems = await this.shoppingItemRepo
      .createQueryBuilder('item')
      .innerJoin(ShoppingList, 'list', 'list.id = item.list_id')
      .where('list.family_id = :familyId', { familyId })
      .andWhere('item.is_checked = true')
      .getCount();

    return {
      total_cost: Number(totalCost.total_cost || 0),
      total_items: totalItems,
      checked_items: checkedItems,
    };
  }
}
