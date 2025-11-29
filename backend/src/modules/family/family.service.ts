import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Family } from '../../entities/family.entity';
import { MemberService } from '../member/member.service';
import { AddMemberDto } from '../member/dto/add-member.dto';
import type { JwtUser } from 'src/common/types/user.type';
import * as QRCode from 'qrcode';

@Injectable()
export class FamilyService {
  constructor(
    @InjectRepository(Family)
    private readonly familyRepository: Repository<Family>,

    private readonly memberService: MemberService,
  ) { }

  private async findFamilyOrFail(id: number) {
    const family = await this.familyRepository.findOne({
      where: { id },
      relations: ['members', 'members.user'],
    });
    if (!family) throw new NotFoundException(`Không tìm thấy gia đình ${id}`);
    return family;
  }

  private ensureOwnerOrAdmin(family: Family, userId: number, role: string) {
    if (family.owner_id !== userId && role !== 'admin') {
      throw new ForbiddenException('Bạn không phải chủ hay admin');
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
    return this.findFamilyOrFail(id);
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

    return families;
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
    this.ensureOwnerOrAdmin(family, userId, role);

    // Xóa tất cả members trước khi xóa family
    const members = await this.memberService.getMembersByFamily(id);
    if (members.length > 0) {
      await this.memberService.deleteAllMembersByFamily(id);
    }

    // Xóa family
    await this.familyRepository.delete(id);
  }

  /**
   * Lấy mã mời và QR code của family
   */
  async getInvitationCode(familyId: number, userId: number, role: string) {
    const family = await this.findFamilyOrFail(familyId);

    // Chỉ owner hoặc admin mới có thể xem mã mời
    this.ensureOwnerOrAdmin(family, userId, role);

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
      throw new NotFoundException('Mã mời không hợp lệ');
    }

    // Kiểm tra user đã là thành viên chưa
    const existingMember = await this.memberService.getMembersByFamily(family.id);
    const isAlreadyMember = existingMember.some(m => m.user_id === user.id);

    if (isAlreadyMember) {
      throw new BadRequestException('Bạn đã là thành viên của gia đình này');
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
      throw new NotFoundException('Bạn không phải thành viên của gia đình này');
    }

    // Nếu là owner, kiểm tra số lượng member
    if (family.owner_id === userId) {
      // Nếu chỉ còn 1 người (chính owner), không cho phép rời
      // Hoặc có thể xóa luôn family (tùy business logic)
      if (member.length === 1) {
        throw new BadRequestException(
          'Bạn là chủ nhóm duy nhất. Vui lòng xóa nhóm hoặc chuyển quyền chủ nhóm trước khi rời.'
        );
      }

      // Nếu còn nhiều người, yêu cầu chuyển quyền owner trước
      throw new BadRequestException(
        'Bạn là chủ nhóm. Vui lòng chuyển quyền chủ nhóm cho người khác trước khi rời.'
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
