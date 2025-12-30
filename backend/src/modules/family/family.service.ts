import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Family } from '../../entities/family.entity';
import { FamilyMember } from '../../entities/family-member.entity';
import { Refrigerator } from '../../entities/refrigerator.entity';
import { FridgeDish } from '../../entities/fridge-dish.entity';
import { FridgeIngredient } from '../../entities/fridge-ingredient.entity';
import { ShoppingList } from '../../entities/shopping-list.entity';
import { ShoppingItem } from '../../entities/shopping-item.entity';
import { Menu } from '../../entities/menu.entity';
import { MenuDish } from '../../entities/menu-dish.entity';
import { FamilyNote } from '../../entities/family-note.entity';
import { ConsumptionHistory } from '../../entities/consumption-history.entity';
import { MemberService } from '../member/member.service';
import { AddMemberDto } from '../member/dto/add-member.dto';
import type { JwtUser } from 'src/common/types/user.type';
import * as QRCode from 'qrcode';
import { ResponseCode, ResponseMessageVi } from 'src/common/errors/error-codes';

@Injectable()
export class FamilyService {
  constructor(
    @InjectRepository(Family)
    private readonly familyRepository: Repository<Family>,

    @InjectRepository(FamilyMember)
    private readonly familyMemberRepository: Repository<FamilyMember>,

    @InjectRepository(Refrigerator)
    private readonly refrigeratorRepository: Repository<Refrigerator>,

    @InjectRepository(FridgeDish)
    private readonly fridgeDishRepository: Repository<FridgeDish>,

    @InjectRepository(FridgeIngredient)
    private readonly fridgeIngredientRepository: Repository<FridgeIngredient>,

    @InjectRepository(ShoppingList)
    private readonly shoppingListRepository: Repository<ShoppingList>,

    @InjectRepository(ShoppingItem)
    private readonly shoppingItemRepository: Repository<ShoppingItem>,

    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,

    @InjectRepository(MenuDish)
    private readonly menuDishRepository: Repository<MenuDish>,

    @InjectRepository(FamilyNote)
    private readonly familyNoteRepository: Repository<FamilyNote>,

    @InjectRepository(ConsumptionHistory)
    private readonly consumptionHistoryRepository: Repository<ConsumptionHistory>,

    private readonly memberService: MemberService,
  ) { }

  private async findFamilyOrFail(id: number) {
    const family = await this.familyRepository.findOne({
      where: { id },
      relations: ['members', 'members.user'],
    });
    if (!family) throw new NotFoundException(ResponseMessageVi[ResponseCode.C00190]);
    return family;
  }

  private ensureOwnerOrAdmin(family: Family, userId: number, role: string) {
    if (family.owner_id !== userId && role !== 'admin') {
      throw new ForbiddenException(ResponseMessageVi[ResponseCode.C00191]);
    }
  }

  private async ensureOwnerAdminOrManager(family: Family, userId: number, role: string) {
    const isOwner = family.owner_id === userId;
    const isAdmin = role === 'admin';
    
    // Kiểm tra xem user có phải manager không
    let isManager = false;
    if (!isOwner && !isAdmin) {
      const members = await this.memberService.getMembersByFamily(family.id);
      const currentMember = members.find(m => m.user_id === userId);
      isManager = currentMember?.role === 'manager';
    }

    if (!isOwner && !isAdmin && !isManager) {
      throw new ForbiddenException(ResponseMessageVi[ResponseCode.C00191]);
    }
  }

  /**
   * Tạo mã mời duy nhất cho family
   */
  private async generateInvitationCode(): Promise<string> {
    let code: string = '';
    let isUnique = false;

    while (!isUnique) {
      // Tạo mã 8 ký tự gồm chữ hoa và số
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Kiểm tra mã đã tồn tại chưa
      const existing = await this.familyRepository.findOne({
        where: { invitation_code: code },
      });

      if (!existing) {
        isUnique = true;
      }
    }

    return code;
  }

  async createFamily(name: string, ownerId: number, user: JwtUser): Promise<Family> {
    // Tạo mã mời khi tạo family
    const invitationCode = await this.generateInvitationCode();
    const family = this.familyRepository.create({
      name,
      owner_id: ownerId,
      invitation_code: invitationCode,
    });
    const saved = await this.familyRepository.save(family);
    await this.memberService.addMember(
      { family_id: saved.id, user_id: ownerId, role: 'manager' },
      user
    );

    return saved;
  }

  async addMember(family_id: number, member_id: number, role: 'member' | 'manager', user: JwtUser) {
    const data: AddMemberDto = {
      family_id: family_id,
      user_id: member_id,
      role: role,
    }
    const member = await this.memberService.addMember(data, user)
    return member
  }

  async getAllFamilies() {
    return this.familyRepository.find({
      relations: ['members', 'members.user'],
    });
  }

  async getFamilyById(id: number) {
    const family = await this.familyRepository.findOne({
      where: { id },
      relations: ['members', 'members.user', 'owner'], // Thêm relation owner
    });
    if (!family) throw new NotFoundException(ResponseMessageVi[ResponseCode.C00190]);
    return family;
  }

  /**
   * Lấy danh sách thành viên của family kèm thông tin user chi tiết
   */
  async getFamilyMembersWithDetails(familyId: number, userId: number) {
    // Kiểm tra family có tồn tại không
    const family = await this.findFamilyOrFail(familyId);

    // Kiểm tra user có phải là thành viên của family không
    const members = await this.memberService.getMembersByFamily(familyId);
    const isMember = members.some(m => m.user_id === userId);

    if (!isMember) {
      throw new ForbiddenException(ResponseMessageVi[ResponseCode.C00192]);
    }

    // Lấy danh sách members với thông tin user
    const membersWithDetails = await this.familyMemberRepository.find({
      where: { family_id: familyId },
      relations: ['user'],
    });

    // Format response
    return membersWithDetails.map(member => ({
      id: member.id,
      user_id: member.user_id,
      role: member.role,
      joined_at: member.joined_at,
      user: {
        id: member.user.id,
        full_name: member.user.full_name,
        email: member.user.email,
        avatar_url: member.user.avatar_url,
      },
    }));
  }

  async getMyFamily(userId: number) {
    // Lấy các record Member của user
    const members = await this.memberService.getMyFamily(userId);

    // Lấy tất cả familyId từ members
    const familyIds = members.map(m => m.family_id);

    if (familyIds.length === 0) return [];

    // Lấy các family cùng members
    const families = await this.familyRepository.find({
      where: { id: In(familyIds) },
      relations: ['members', 'members.user'],
    });

    // Add memberCount to each family
    return families.map(family => ({
      ...family,
      memberCount: family.members?.length || 0,
    }));
  }

  async updateFamily(
    id: number,
    dto: Partial<Family>,
    userId: number,
    role: string,
  ) {
    const family = await this.findFamilyOrFail(id);
    this.ensureOwnerOrAdmin(family, userId, role);

    Object.assign(family, dto);
    return this.familyRepository.save(family);
  }

  async deleteFamily(id: number, userId: number, role: string) {
    const family = await this.findFamilyOrFail(id);
    await this.ensureOwnerAdminOrManager(family, userId, role);

    // Xóa tất cả dữ liệu liên quan đến family theo thứ tự:
    
    // 1. Xóa tất cả members
    const members = await this.memberService.getMembersByFamily(id);
    if (members.length > 0) {
      await this.memberService.deleteAllMembersByFamily(id);
    }

    // 2. Xóa tất cả dữ liệu liên quan đến refrigerators
    // Lấy tất cả refrigerators của family
    const refrigerators = await this.refrigeratorRepository.find({
      where: { family_id: id },
    });
    
    if (refrigerators.length > 0) {
      const refrigeratorIds = refrigerators.map(r => r.id);
      
      // Xóa tất cả fridge_dishes của các refrigerators
      await this.fridgeDishRepository.delete({ refrigerator_id: In(refrigeratorIds) });
      
      // Xóa tất cả fridge_ingredients của các refrigerators
      await this.fridgeIngredientRepository.delete({ refrigerator_id: In(refrigeratorIds) });
      
      // Sau đó mới xóa refrigerators
      await this.refrigeratorRepository.delete({ family_id: id });
    }

    // 3. Xóa tất cả dữ liệu liên quan đến shopping lists
    // Lấy tất cả shopping lists của family
    const shoppingLists = await this.shoppingListRepository.find({
      where: { family_id: id },
    });
    
    if (shoppingLists.length > 0) {
      const shoppingListIds = shoppingLists.map(list => list.id);
      
      // Xóa tất cả shopping_items của các shopping lists
      await this.shoppingItemRepository.delete({ list_id: In(shoppingListIds) });
      
      // Sau đó mới xóa shopping lists
      await this.shoppingListRepository.delete({ family_id: id });
    }

    // 4. Xóa tất cả dữ liệu liên quan đến menus
    // Lấy tất cả menus của family
    const menus = await this.menuRepository.find({
      where: { family_id: id },
    });
    
    if (menus.length > 0) {
      const menuIds = menus.map(menu => menu.id);
      
      // Xóa tất cả menu_dishes của các menus
      await this.menuDishRepository.delete({ menu_id: In(menuIds) });
      
      // Sau đó mới xóa menus
      await this.menuRepository.delete({ family_id: id });
    }

    // 5. Xóa tất cả family notes
    await this.familyNoteRepository.delete({ family_id: id });

    // 6. Xóa tất cả consumption history
    await this.consumptionHistoryRepository.delete({ family_id: id });

    // 7. Chat sẽ tự động xóa do có onDelete: 'CASCADE'

    // Cuối cùng, xóa family
    await this.familyRepository.delete(id);
  }

  /**
   * Lấy mã mời và QR code của family
   */
  async getInvitationCode(familyId: number, userId: number, role: string) {
    const family = await this.findFamilyOrFail(familyId);

    // Kiểm tra quyền: owner, admin hoặc manager
    const isOwner = family.owner_id === userId;
    const isAdmin = role === 'admin';
    
    // Kiểm tra xem user có phải manager không
    let isManager = false;
    if (!isOwner && !isAdmin) {
      const members = await this.memberService.getMembersByFamily(familyId);
      const currentMember = members.find(m => m.user_id === userId);
      isManager = currentMember?.role === 'manager';
    }

    if (!isOwner && !isAdmin && !isManager) {
      throw new ForbiddenException(ResponseMessageVi[ResponseCode.C00191]);
    }

    if (!family.invitation_code) {
      // Nếu chưa có mã mời, tạo mới
      family.invitation_code = await this.generateInvitationCode();
      await this.familyRepository.save(family);
    }

    // Tạo QR code từ mã mời
    const qrCodeDataUrl = await QRCode.toDataURL(family.invitation_code, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
    });

    return {
      invitation_code: family.invitation_code,
      qr_code: qrCodeDataUrl,
      family_id: family.id,
      family_name: family.name,
    };
  }

  /**
   * Tham gia family bằng mã mời
   */
  async joinFamilyByCode(invitationCode: string, user: JwtUser) {
    const family = await this.familyRepository.findOne({
      where: { invitation_code: invitationCode },
    });

    if (!family) {
      throw new NotFoundException(ResponseMessageVi[ResponseCode.C00193]);
    }

    // Kiểm tra user đã là thành viên chưa
    const existingMember = await this.memberService.getMembersByFamily(family.id);
    const isAlreadyMember = existingMember.some(m => m.user_id === user.id);

    if (isAlreadyMember) {
      throw new BadRequestException(ResponseMessageVi[ResponseCode.C00194]);
    }

    // Thêm user vào family với role 'member' bằng cách gọi trực tiếp memberService
    // Vì có mã mời hợp lệ, nên cho phép tự tham gia
    const member = await this.memberService.addMemberByInvitation(
      {
        family_id: family.id,
        user_id: user.id,
        role: 'member',
      }
    );

    return {
      message: 'Tham gia gia đình thành công',
      family: {
        id: family.id,
        name: family.name,
      },
      member,
    };
  }

  /**
   * Rời khỏi family
   */
  async leaveFamily(familyId: number, userId: number) {
    const family = await this.findFamilyOrFail(familyId);

    // Tìm member record
    const member = await this.memberService.getMembersByFamily(familyId);
    const userMember = member.find(m => m.user_id === userId);

    if (!userMember) {
      throw new NotFoundException(ResponseMessageVi[ResponseCode.C00192]);
    }

    // Nếu là owner, kiểm tra số lượng member
    if (family.owner_id === userId) {
      // Nếu chỉ còn 1 người (chính owner), không cho phép rời
      // Hoặc có thể xóa luôn family (tùy business logic)
      if (member.length === 1) {
        throw new BadRequestException(
          ResponseMessageVi[ResponseCode.C00195]
        );
      }

      // Nếu còn nhiều người, yêu cầu chuyển quyền owner trước
      throw new BadRequestException(
        ResponseMessageVi[ResponseCode.C00196]
      );
    }

    // Xóa member record
    await this.memberService.removeMemberById(userMember.id);

    return {
      message: 'Đã rời khỏi gia đình thành công',
      family: {
        id: family.id,
        name: family.name,
      },
    };
  }
}
