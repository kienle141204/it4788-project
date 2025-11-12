import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShoppingList } from '../../entities/shopping-list.entity';
import { CreateShoppingListDto } from './dto/create-shopping-list.dto';
import { UpdateShoppingListDto } from './dto/update-shopping-list.dto';
import { FamilyService } from '../family/family.service';
import { MemberService } from '../member/member.service';
import { JwtUser } from 'src/common/types/user.type';

@Injectable()
export class ShoppingListService {
  constructor(
    @InjectRepository(ShoppingList)
    private readonly shoppingListRepo: Repository<ShoppingList>,

    private readonly familyService: FamilyService,
    private readonly memberService: MemberService,
  ) { }

  /** Tạo mới Shopping List */
  async create(dto: CreateShoppingListDto, user: JwtUser): Promise<ShoppingList> {
    // Clone dto để không mutate
    const data: Partial<CreateShoppingListDto> = { ...dto };

    // Nếu không chỉ định owner_id thì tự tạo
    if (!data.owner_id) {
      data.owner_id = user.id;
      const list = this.shoppingListRepo.create(data);
      return this.shoppingListRepo.save(list);
    }

    // Nếu chỉ định owner khác user
    if (data.owner_id !== user.id) {
      if (!data.family_id) {
        throw new UnauthorizedException('Bạn không thể tạo cho người này');
      }

      const family = await this.familyService.getFamilyById(data.family_id);
      if (family.owner_id !== user.id) {
        throw new UnauthorizedException('Bạn không phải là trưởng nhóm');
      }
    }

    const list = this.shoppingListRepo.create(data);
    return this.shoppingListRepo.save(data);
  }

  /** Lấy toàn bộ danh sách (kèm owner, family, items) */
  async findAll(): Promise<ShoppingList[]> {
    return await this.shoppingListRepo.find({
      relations: ['owner', 'family', 'items', 'items.ingredient'],
      order: { created_at: 'DESC' },
    });
  }

  // Lấy ra toàn bộ các danh sách của bản thân
  async myShoppingList(user: JwtUser): Promise<ShoppingList[]> {
    return await this.shoppingListRepo.find({
      where: { owner_id: user.id },
      relations: ['family', 'items', 'items.ingredient'],
      order: { created_at: 'DESC' },
    });
  }

  // Lấy ra toàn bộ các danh sách các danh sách mua sắm đã được share trong gia đình
  async myFamilyShared(family_id: number, user: JwtUser): Promise<ShoppingList[]> {
    // Lấy tất cả thành viên của family
    const members = await this.memberService.getMembersByFamily(family_id);

    // Kiểm tra user có thuộc family không
    const isMember = members.some(member => member.user_id === user.id);
    if (!isMember) {
      throw new UnauthorizedException('Bạn không thuộc gia đình này');
    }

    // Lấy các shopping list được chia sẻ trong family
    return this.shoppingListRepo.find({
      where: { family_id, is_shared: true },
      relations: ['family', 'items', 'items.ingredient'],
      order: { created_at: 'DESC' },
    });
  }

  /** Lấy 1 danh sách theo id */
  async findOne(id: number, user: JwtUser): Promise<ShoppingList> {
    const list = await this.shoppingListRepo.findOne({
      where: { id },
      relations: ['family', 'items', 'items.ingredient'],
    });

    if (!list) {
      throw new NotFoundException(`Shopping list with ID ${id} not found`);
    }

    if (user.role !== 'admin' && list.owner_id !== user.id) {
      throw new UnauthorizedException('Bạn không thể xem danh sách này');
    }

    return list;
  }

  // Share danh sách mua sắm
  async shareShoppingList(id: number, user: JwtUser): Promise<ShoppingList> {
    const list = await this.findOne(id, user);

    list.is_shared = true;

    return await this.shoppingListRepo.save(list);
  }

  /** Cập nhật danh sách */
  async update(id: number, updateDto: UpdateShoppingListDto, user: JwtUser): Promise<ShoppingList> {
    const list = await this.findOne(id, user);

    Object.assign(list, updateDto);
    return await this.shoppingListRepo.save(list);
  }

  /** Xóa danh sách */
  async remove(id: number, user: JwtUser): Promise<void> {
    const list = await this.findOne(id, user);
    await this.shoppingListRepo.remove(list);
  }
}
