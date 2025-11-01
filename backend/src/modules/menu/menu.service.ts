import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Menu } from '../../entities/menu.entity';
import { MenuDish } from '../../entities/menu-dish.entity';
import { Family } from '../../entities/family.entity';
import { Dish } from '../../entities/dish.entity';
import { FamilyMember } from '../../entities/family-member.entity';
import { CreateMenuDto, CreateMenuDishDto, UpdateMenuDishDto, GetMenusDto } from './dto/menu.dto';

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
   * Lấy danh sách menu với phân trang
   */
  async findAllWithPagination(getMenusDto: GetMenusDto): Promise<{
    data: Menu[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, familyId } = getMenusDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.menuRepository
      .createQueryBuilder('menu')
      .leftJoinAndSelect('menu.family', 'family')
      .leftJoinAndSelect('menu.menuDishes', 'menuDishes')
      .leftJoinAndSelect('menuDishes.dish', 'dish')
      .orderBy('menu.created_at', 'DESC');

    if (familyId) {
      queryBuilder.andWhere('menu.family_id = :familyId', { familyId });
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
  async findOne(id: number): Promise<Menu> {
    const menu = await this.menuRepository.findOne({
      where: { id },
      relations: ['family', 'menuDishes', 'menuDishes.dish'],
    });

    if (!menu) {
      throw new NotFoundException('Không tìm thấy menu');
    }

    return menu;
  }

  /**
   * Tạo menu mới
   */
  async createMenu(createMenuDto: CreateMenuDto, familyId: number, userId: number): Promise<Menu> {
    // Kiểm tra gia đình có tồn tại không
    const family = await this.familyRepository.findOne({ where: { id: familyId } });
    if (!family) {
      throw new NotFoundException('Không tìm thấy gia đình');
    }

    // Kiểm tra user có phải thành viên gia đình không
    const isMember = await this.familyMemberRepository.findOne({
      where: { family_id: familyId, user_id: userId },
    });

    if (!isMember && family.owner_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền tạo menu cho gia đình này');
    }

    // Tạo menu mới
    const menu = this.menuRepository.create({
      family_id: familyId,
      description: createMenuDto.description,
    });

    return await this.menuRepository.save(menu);
  }

  /**
   * Thêm món ăn vào menu
   */
  async addDishToMenu(
    menuId: number,
    createMenuDishDto: CreateMenuDishDto,
    userId: number,
  ): Promise<MenuDish> {
    // Kiểm tra menu có tồn tại không
    const menu = await this.menuRepository.findOne({
      where: { id: menuId },
      relations: ['family'],
    });

    if (!menu) {
      throw new NotFoundException('Không tìm thấy menu');
    }

    // Kiểm tra quyền truy cập
    const isMember = await this.familyMemberRepository.findOne({
      where: { family_id: menu.family_id, user_id: userId },
    });

    if (!isMember && menu.family.owner_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa menu này');
    }

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
  ): Promise<MenuDish> {
    // Tìm menu dish
    const menuDish = await this.menuDishRepository.findOne({
      where: { id: menuDishId },
      relations: ['menu', 'menu.family'],
    });

    if (!menuDish) {
      throw new NotFoundException('Không tìm thấy món ăn trong menu');
    }

    // Kiểm tra quyền truy cập
    const isMember = await this.familyMemberRepository.findOne({
      where: { family_id: menuDish.menu.family_id, user_id: userId },
    });

    if (!isMember && menuDish.menu.family.owner_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa menu này');
    }

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
  async removeDishFromMenu(menuDishId: number, userId: number): Promise<void> {
    // Tìm menu dish
    const menuDish = await this.menuDishRepository.findOne({
      where: { id: menuDishId },
      relations: ['menu', 'menu.family'],
    });

    if (!menuDish) {
      throw new NotFoundException('Không tìm thấy món ăn trong menu');
    }

    // Kiểm tra quyền truy cập
    const isMember = await this.familyMemberRepository.findOne({
      where: { family_id: menuDish.menu.family_id, user_id: userId },
    });

    if (!isMember && menuDish.menu.family.owner_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa menu này');
    }

    await this.menuDishRepository.delete(menuDishId);
  }

  /**
   * Xóa menu
   */
  async deleteMenu(menuId: number, userId: number): Promise<void> {
    // Tìm menu
    const menu = await this.menuRepository.findOne({
      where: { id: menuId },
      relations: ['family'],
    });

    if (!menu) {
      throw new NotFoundException('Không tìm thấy menu');
    }

    // Kiểm tra quyền truy cập
    const isMember = await this.familyMemberRepository.findOne({
      where: { family_id: menu.family_id, user_id: userId },
    });

    if (!isMember && menu.family.owner_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa menu này');
    }

    await this.menuRepository.delete(menuId);
  }
}
