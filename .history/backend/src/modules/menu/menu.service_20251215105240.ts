import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Menu } from '../../entities/menu.entity';
import { MenuDish } from '../../entities/menu-dish.entity';
import { Family } from '../../entities/family.entity';
import { Dish } from '../../entities/dish.entity';
import { FamilyMember } from '../../entities/family-member.entity';
import { CreateMenuDto, UpdateMenuDto, CreateMenuDishDto, UpdateMenuDishDto, GetMenusDto, GetMenuDishesByDateDto } from './dto/menu.dto';
import { ResponseCode, ResponseMessageVi } from 'src/common/errors/error-codes';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Menu)
    private menuRepository: Repository<Menu>,
    @InjectRepository(MenuDish)
    private menuDishRepository: Repository<MenuDish>,
    @InjectRepository(Family)
    private familyRepository: Repository<Family>,
    @InjectRepository(Dish)
    private dishRepository: Repository<Dish>,
    @InjectRepository(FamilyMember)
    private familyMemberRepository: Repository<FamilyMember>,
  ) {}

  /**
   * Helper method: Kiểm tra user có quyền truy cập family không
   * @returns true nếu user là owner hoặc member của family
   */
  private async checkFamilyAccess(familyId: number, userId: number): Promise<boolean> {
    const family = await this.familyRepository.findOne({
      where: { id: familyId },
      select: ['owner_id'],
    });

    if (!family) {
      return false;
    }

    // Kiểm tra user có phải owner không
    if (family.owner_id === userId) {
      return true;
    }

    // Kiểm tra user có phải member không
    const isMember = await this.familyMemberRepository.findOne({
      where: { family_id: familyId, user_id: userId },
    });

    return !!isMember;
  }

  /**
   * Helper method: Lấy danh sách family_id mà user có quyền truy cập
   */
  private async getAccessibleFamilyIds(userId: number): Promise<number[]> {
    const ownedFamilies = await this.familyRepository.find({
      where: { owner_id: userId },
      select: ['id'],
    });
    const ownedFamilyIds = ownedFamilies.map(f => f.id);

    const memberFamilies = await this.familyMemberRepository.find({
      where: { user_id: userId },
      select: ['family_id'],
    });
    const memberFamilyIds = memberFamilies.map(fm => fm.family_id);

    // Gộp danh sách family_id mà user có quyền truy cập
    return [...new Set([...ownedFamilyIds, ...memberFamilyIds])];
  }

  /**
   * Lấy danh sách menu với phân trang
   */
  async findAllWithPagination(
    getMenusDto: GetMenusDto,
    userId: number,
    userRole: string,
  ): Promise<{
    data: Menu[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, familyId, time } = getMenusDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.menuRepository
      .createQueryBuilder('menu')
      .leftJoinAndSelect('menu.family', 'family')
      .leftJoinAndSelect('menu.menuDishes', 'menuDishes')
      .leftJoinAndSelect('menuDishes.dish', 'dish')
      .orderBy('menu.created_at', 'DESC');

    // Nếu role là user, chỉ cho xem menu của các family mà user là owner hoặc member
    if (userRole === 'user') {
      // Lấy danh sách family_id mà user là owner hoặc member
      const ownedFamilies = await this.familyRepository.find({
        where: { owner_id: userId },
        select: ['id'],
      });
      const ownedFamilyIds = ownedFamilies.map(f => f.id);

      const memberFamilies = await this.familyMemberRepository.find({
        where: { user_id: userId },
        select: ['family_id'],
      });
      const memberFamilyIds = memberFamilies.map(fm => fm.family_id);

      // Gộp danh sách family_id mà user có quyền truy cập
      const accessibleFamilyIds = [...new Set([...ownedFamilyIds, ...memberFamilyIds])];

      if (accessibleFamilyIds.length === 0) {
        // User không có quyền truy cập family nào, trả về empty
        return {
          data: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        };
      }

      // Nếu có familyId trong query, kiểm tra xem user có quyền truy cập family đó không
      if (familyId) {
        if (!accessibleFamilyIds.includes(familyId)) {
          throw new ForbiddenException(ResponseMessageVi[ResponseCode.C00139]);
        }
        // Nếu có quyền, chỉ lấy menu của family đó
        queryBuilder.andWhere('menu.family_id = :familyId', { familyId });
      } else {
        // Nếu không có familyId, lấy menu của tất cả các family mà user có quyền truy cập
        queryBuilder.andWhere('menu.family_id IN (:...accessibleFamilyIds)', {
          accessibleFamilyIds,
        });
      }
    } else {
      // Nếu role là admin, có thể lọc theo familyId nếu có
      if (familyId) {
        queryBuilder.andWhere('menu.family_id = :familyId', { familyId });
      }
    }

    if (time) {
      queryBuilder.andWhere('menu.time = :time', { time });
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
   * Lấy menu theo ID
   */
  async findOne(id: number, userId: number, userRole: string): Promise<Menu> {
    const menu = await this.menuRepository.findOne({
      where: { id },
      relations: ['family', 'menuDishes', 'menuDishes.dish'],
    });

    if (!menu) {
      throw new NotFoundException('Không tìm thấy menu');
    }

    // Nếu role là user, kiểm tra quyền truy cập
    if (userRole === 'user') {
      // Kiểm tra user có phải owner của family không
      const isOwner = menu.family.owner_id === userId;

      // Kiểm tra user có phải member của family không
      const isMember = await this.familyMemberRepository.findOne({
        where: { family_id: menu.family_id, user_id: userId },
      });

      if (!isOwner && !isMember) {
        throw new ForbiddenException('Bạn không có quyền xem menu này');
      }
    }

    return menu;
  }

  /**
   * Tạo menu mới
   */
  async createMenu(createMenuDto: CreateMenuDto, familyId: number, userId: number, userRole: string): Promise<Menu> {
    // Kiểm tra gia đình có tồn tại không
    const family = await this.familyRepository.findOne({ where: { id: familyId } });
    if (!family) {
      throw new NotFoundException('Không tìm thấy gia đình');
    }

    // Nếu role là user, kiểm tra quyền truy cập
    if (userRole === 'user') {
      // Kiểm tra user có phải thành viên gia đình không
      const isMember = await this.familyMemberRepository.findOne({
        where: { family_id: familyId, user_id: userId },
      });

      if (!isMember && family.owner_id !== userId) {
        throw new ForbiddenException('Bạn không có quyền tạo menu cho gia đình này');
      }
    }
    // Nếu role là admin, không cần kiểm tra quyền

    // Tạo menu mới
    const menu = this.menuRepository.create({
      family_id: familyId,
      time: createMenuDto.time ?? null,
      description: createMenuDto.description ?? null,
    });

    const savedMenu = await this.menuRepository.save(menu);
    return savedMenu;
  }

  /**
   * Cập nhật menu
   */
  async updateMenu(
    menuId: number,
    updateMenuDto: UpdateMenuDto,
    userId: number,
    userRole: string,
  ): Promise<Menu> {
    // Tìm menu
    const menu = await this.menuRepository.findOne({
      where: { id: menuId },
      relations: ['family'],
    });

    if (!menu) {
      throw new NotFoundException('Không tìm thấy menu');
    }

    // Nếu role là user, kiểm tra quyền truy cập
    if (userRole === 'user') {
      // Kiểm tra quyền truy cập
      const isMember = await this.familyMemberRepository.findOne({
        where: { family_id: menu.family_id, user_id: userId },
      });

      if (!isMember && menu.family.owner_id !== userId) {
        throw new ForbiddenException('Bạn không có quyền chỉnh sửa menu này');
      }
    }
    // Nếu role là admin, không cần kiểm tra quyền

    // Cập nhật menu
    if (updateMenuDto.time !== undefined) {
      menu.time = updateMenuDto.time;
    }
    if (updateMenuDto.description !== undefined) {
      menu.description = updateMenuDto.description;
    }

    return await this.menuRepository.save(menu);
  }

  /**
   * Thêm món ăn vào menu
   */
  async addDishToMenu(
    menuId: number,
    createMenuDishDto: CreateMenuDishDto,
    userId: number,
    userRole: string,
  ): Promise<MenuDish> {
    // Kiểm tra menu có tồn tại không
    const menu = await this.menuRepository.findOne({
      where: { id: menuId },
      relations: ['family'],
    });

    if (!menu) {
      throw new NotFoundException('Không tìm thấy menu');
    }

    // Nếu role là user, kiểm tra quyền truy cập
    if (userRole === 'user') {
      // Kiểm tra quyền truy cập
      const isMember = await this.familyMemberRepository.findOne({
        where: { family_id: menu.family_id, user_id: userId },
      });

      if (!isMember && menu.family.owner_id !== userId) {
        throw new ForbiddenException('Bạn không có quyền chỉnh sửa menu này');
      }
    }
    // Nếu role là admin, không cần kiểm tra quyền

    // Kiểm tra món ăn có tồn tại không
    const dish = await this.dishRepository.findOne({ where: { id: createMenuDishDto.dish_id } });
    if (!dish) {
      throw new NotFoundException('Không tìm thấy món ăn');
    }

    // Kiểm tra món ăn đã có trong menu chưa
    const existingMenuDish = await this.menuDishRepository.findOne({
      where: { menu_id: menuId, dish_id: createMenuDishDto.dish_id },
    });

    if (existingMenuDish) {
      throw new ForbiddenException('Món ăn này đã có trong menu');
    }

    // Tạo menu dish mới
    const menuDish = this.menuDishRepository.create({
      menu_id: menuId,
      dish_id: createMenuDishDto.dish_id,
      stock: createMenuDishDto.stock,
      price: createMenuDishDto.price,
    });

    return await this.menuDishRepository.save(menuDish);
  }

  /**
   * Cập nhật món ăn trong menu
   */
  async updateMenuDish(
    menuDishId: number,
    updateMenuDishDto: UpdateMenuDishDto,
    userId: number,
    userRole: string,
  ): Promise<MenuDish> {
    // Tìm menu dish
    const menuDish = await this.menuDishRepository.findOne({
      where: { id: menuDishId },
      relations: ['menu', 'menu.family'],
    });

    if (!menuDish) {
      throw new NotFoundException('Không tìm thấy món ăn trong menu');
    }

    // Nếu role là user, kiểm tra quyền truy cập
    if (userRole === 'user') {
      // Kiểm tra quyền truy cập
      const isMember = await this.familyMemberRepository.findOne({
        where: { family_id: menuDish.menu.family_id, user_id: userId },
      });

      if (!isMember && menuDish.menu.family.owner_id !== userId) {
        throw new ForbiddenException('Bạn không có quyền chỉnh sửa menu này');
      }
    }
    // Nếu role là admin, không cần kiểm tra quyền

    // Cập nhật menu dish
    await this.menuDishRepository.update(menuDishId, {
      stock: updateMenuDishDto.stock,
      price: updateMenuDishDto.price,
    });

    // Trả về menu dish đã cập nhật
    const updatedMenuDish = await this.menuDishRepository.findOne({
      where: { id: menuDishId },
      relations: ['dish'],
    });

    if (!updatedMenuDish) {
      throw new NotFoundException('Không tìm thấy món ăn trong menu sau khi cập nhật');
    }

    return updatedMenuDish;
  }

  /**
   * Xóa món ăn khỏi menu
   */
  async removeDishFromMenu(menuDishId: number, userId: number, userRole: string): Promise<void> {
    // Tìm menu dish
    const menuDish = await this.menuDishRepository.findOne({
      where: { id: menuDishId },
      relations: ['menu', 'menu.family'],
    });

    if (!menuDish) {
      throw new NotFoundException('Không tìm thấy món ăn trong menu');
    }

    // Nếu role là user, kiểm tra quyền truy cập
    if (userRole === 'user') {
      // Kiểm tra quyền truy cập
      const isMember = await this.familyMemberRepository.findOne({
        where: { family_id: menuDish.menu.family_id, user_id: userId },
      });

      if (!isMember && menuDish.menu.family.owner_id !== userId) {
        throw new ForbiddenException('Bạn không có quyền chỉnh sửa menu này');
      }
    }
    // Nếu role là admin, không cần kiểm tra quyền

    await this.menuDishRepository.delete(menuDishId);
  }

  /**
   * Xóa menu
   */
  async deleteMenu(menuId: number, userId: number, userRole: string): Promise<void> {
    // Tìm menu
    const menu = await this.menuRepository.findOne({
      where: { id: menuId },
      relations: ['family'],
    });

    if (!menu) {
      throw new NotFoundException('Không tìm thấy menu');
    }

    // Nếu role là user, kiểm tra quyền truy cập
    if (userRole === 'user') {
      // Kiểm tra quyền truy cập
      const isMember = await this.familyMemberRepository.findOne({
        where: { family_id: menu.family_id, user_id: userId },
      });

      if (!isMember && menu.family.owner_id !== userId) {
        throw new ForbiddenException('Bạn không có quyền xóa menu này');
      }
    }
    await this.menuDishRepository.delete({ menu_id: menuId });

    await this.menuRepository.delete(menuId);
  }

  /**
   * Lấy danh sách menu dishes theo ngày (từ created_at của menu)
   */
  async getMenuDishesByDate(
    getMenuDishesByDateDto: GetMenuDishesByDateDto,
    userId: number,
    userRole: string,
  ): Promise<any[]> {
    const { date } = getMenuDishesByDateDto;

    const queryBuilder = this.menuDishRepository
      .createQueryBuilder('menuDish')
      .leftJoinAndSelect('menuDish.dish', 'dish')
      .leftJoinAndSelect('menuDish.menu', 'menu')
      .leftJoinAndSelect('menu.family', 'family')
      .orderBy('menuDish.created_at', 'ASC');

    // Nếu role là user, chỉ cho xem menu dishes của các family mà user là owner hoặc member
    if (userRole === 'user') {
      // Lấy danh sách family_id mà user là owner hoặc member
      const ownedFamilies = await this.familyRepository.find({
        where: { owner_id: userId },
        select: ['id'],
      });
      const ownedFamilyIds = ownedFamilies.map(f => f.id);

      const memberFamilies = await this.familyMemberRepository.find({
        where: { user_id: userId },
        select: ['family_id'],
      });
      const memberFamilyIds = memberFamilies.map(fm => fm.family_id);

      // Gộp danh sách family_id mà user có quyền truy cập
      const accessibleFamilyIds = [...new Set([...ownedFamilyIds, ...memberFamilyIds])];

      if (accessibleFamilyIds.length === 0) {
        // User không có quyền truy cập family nào, trả về empty
        return [];
      }

      // Chỉ lấy menu dishes của các menu thuộc các family mà user có quyền truy cập
      queryBuilder.where('family.id IN (:...accessibleFamilyIds)', {
        accessibleFamilyIds,
      });

      // Nếu có date, thêm điều kiện lọc theo ngày
      if (date) {
        queryBuilder.andWhere('DATE(menu.created_at) = :date', { date });
      }
    } else {
      // Nếu role là admin và có date, lọc theo ngày
      if (date) {
        queryBuilder.where('DATE(menu.created_at) = :date', { date });
      }
      // Nếu admin và không có date, xem tất cả menu dishes
    }

    const menuDishes = await queryBuilder.getMany();

    // Format lại response để bao gồm tên món ăn
    const result = menuDishes.map(menuDish => ({
      id: menuDish.id,
      menu_id: menuDish.menu_id,
      dish_id: menuDish.dish_id,
      stock: menuDish.stock,
      price: menuDish.price,
      created_at: menuDish.created_at,
      dish_name: menuDish.dish ? menuDish.dish.name : null,
    }));

    return result;
  }

  /**
   * Tính tổng tiền bữa ăn cho một menu
   */
  async calculateMenuTotal(
    menuId: number,
    userId: number,
    userRole: string,
  ): Promise<{
    menu_id: number;
    total_amount: number;
    items_count: number;
    items: any[];
  }> {
    // Tìm menu và kiểm tra quyền truy cập
    const menu = await this.menuRepository.findOne({
      where: { id: menuId },
      relations: ['family'],
    });

    if (!menu) {
      throw new NotFoundException('Không tìm thấy menu');
    }

    // Nếu role là user, kiểm tra quyền truy cập
    if (userRole === 'user') {
      // Kiểm tra user có phải owner của family không
      const isOwner = menu.family.owner_id === userId;

      // Kiểm tra user có phải member của family không
      const isMember = await this.familyMemberRepository.findOne({
        where: { family_id: menu.family_id, user_id: userId },
      });

      if (!isOwner && !isMember) {
        throw new ForbiddenException('Bạn không có quyền xem menu này');
      }
    }

    // Lấy tất cả menu dishes của menu
    const menuDishes = await this.menuDishRepository.find({
      where: { menu_id: menuId },
      relations: ['dish'],
    });

    // Tính tổng: stock * price
    let totalAmount = 0;
    const items = menuDishes.map(menuDish => {
      const itemTotal = (menuDish.stock || 0) * (parseFloat(menuDish.price?.toString() || '0'));
      totalAmount += itemTotal;

      return {
        id: menuDish.id,
        dish_id: menuDish.dish_id,
        dish_name: menuDish.dish ? menuDish.dish.name : null,
        stock: menuDish.stock,
        price: menuDish.price,
        item_total: itemTotal,
      };
    });

    return {
      menu_id: menuId,
      total_amount: Math.round(totalAmount * 100) / 100, // Làm tròn 2 chữ số thập phân
      items_count: items.length,
      items,
    };
  }
}
