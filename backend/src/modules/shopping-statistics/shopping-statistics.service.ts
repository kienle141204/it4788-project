import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShoppingList } from '../../entities/shopping-list.entity';
import { ShoppingItem } from 'src/entities/shopping-item.entity';
import { FamilyService } from '../family/family.service';
import { MemberService } from '../member/member.service';

@Injectable()
export class ShoppingStatisticsService {
  constructor(
    @InjectRepository(ShoppingList)
    private readonly shoppingListRepo: Repository<ShoppingList>,
    @InjectRepository(ShoppingItem)
    private readonly shoppingItemRepo: Repository<ShoppingItem>,

    private readonly familyService: FamilyService,
    private readonly memberService: MemberService,
  ) { }

  /** Tổng số tiền đã mua theo tháng */
  async totalCostByMonth(year: number, userId: number) {
    return await this.shoppingListRepo
      .createQueryBuilder('list')
      .select("DATE_TRUNC('month', list.created_at)", 'month')
      .addSelect('SUM(list.cost)', 'total_cost')
      .where('list.owner_id = :userId', { userId })
      .andWhere('EXTRACT(YEAR FROM list.created_at) = :year', { year })
      .groupBy("DATE_TRUNC('month', list.created_at)")
      .orderBy("DATE_TRUNC('month', list.created_at)", 'ASC')
      .getRawMany();
  }

  /** Số lượng item đã check trong danh sách */
  async countCheckedItems(userId: number) {
    return await this.shoppingItemRepo
      .createQueryBuilder('item')
      .innerJoin(ShoppingList, 'list', 'list.id = item.list_id')
      .where('list.owner_id = :userId', { userId })
      .andWhere('item.is_checked = true')
      .getCount();
  }

  /** Top nguyên liệu được mua theo số lượng (stock) */
  async topIngredients(limit: number = 5, userId: number) {
    return await this.shoppingItemRepo
      .createQueryBuilder('item')
      .select('item.ingredient_id', 'ingredient_id')
      .addSelect('SUM(item.stock)', 'total_quantity')
      .innerJoin(ShoppingList, 'list', 'list.id = item.list_id')
      .where('list.owner_id = :userId', { userId })
      .groupBy('item.ingredient_id')
      .orderBy('total_quantity', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  /** Top nguyên liệu theo tổng tiền */
  async topIngredientsByCost(limit: number = 5, userId: number) {
    return await this.shoppingItemRepo
      .createQueryBuilder('item')
      .select('item.ingredient_id', 'ingredient_id')
      .addSelect('SUM(item.stock * item.price)', 'total_cost')
      .innerJoin(ShoppingList, 'list', 'list.id = item.list_id')
      .where('list.owner_id = :userId', { userId })
      .groupBy('item.ingredient_id')
      .orderBy('total_cost', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  // Thống kê mua sắm theo user
  async statisticsByUser(userId: number) {
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
      checked_items: checkedItems
    };
  }

  // Thống kê mua sắm theo family
  async statisticsByFamily(familyId: number) {
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
      checked_items: checkedItems
    };
  }
}
