import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FamilyMember } from '../../entities/family-member.entity';
import { Family } from '../../entities/family.entity';
import { User } from '../../entities/user.entity';
import { AddMemberDto } from './dto/add-member.dto';
import type { JwtUser } from 'src/common/types/user.type';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MemberService {
  constructor(
    @InjectRepository(FamilyMember)
    private readonly memberRepository: Repository<FamilyMember>,

    @InjectRepository(Family)
    private readonly familyRepository: Repository<Family>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) { }

  /** Add member */
  async addMember(
    dto: AddMemberDto,
    user: JwtUser,
  ): Promise<FamilyMember> {
    const { family_id, user_id, role } = dto;

    const family = await this.familyRepository.findOne({
      where: { id: family_id },
    });
    if (!family) throw new NotFoundException(`Không tìm thấy ${family_id}`);

    // Only family owner or admin can add members
    if (family.owner_id !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('Bạn không thể thêm người này vào trong gia đình');
    }

    const exists = await this.memberRepository.findOne({
      where: { family_id, user_id },
    });
    if (exists) throw new BadRequestException('Người này đã có trong gia đình');

    // Lấy thông tin user được thêm vào
    const newMemberUser = await this.userRepository.findOne({
      where: { id: user_id },
    });
    if (!newMemberUser) throw new NotFoundException(`Không tìm thấy user ${user_id}`);

    const member = this.memberRepository.create({
      family_id,
      user_id,
      role,
    });

    const savedMember = await this.memberRepository.save(member);

    // Tạo thông báo cho thành viên mới
    try {
      await this.notificationsService.createNotification(
        user_id,
        'Chúc mừng bạn đã trở thành thành viên của nhóm',
        `Bạn đã được thêm vào nhóm "${family.name}" thành công. Chúc mừng bạn!`,
      );
    } catch (error) {
      console.error('Error creating notification for new member:', error);
    }

    // Tạo thông báo cho owner (người thêm thành viên)
    try {
      await this.notificationsService.createNotification(
        user.id,
        'Thêm thành viên thành công',
        `${newMemberUser.full_name || 'Người dùng'} đã được thêm vào nhóm "${family.name}" thành công.`,
      );
    } catch (error) {
      console.error('Error creating notification for owner:', error);
    }

    return savedMember;
  }

  /**
   * Thêm member bằng mã mời (không cần permission check)
   */
  async addMemberByInvitation(dto: AddMemberDto): Promise<FamilyMember> {
    const { family_id, user_id, role } = dto;

    const family = await this.familyRepository.findOne({
      where: { id: family_id },
    });
    if (!family) throw new NotFoundException(`Không tìm thấy family ${family_id}`);

    const exists = await this.memberRepository.findOne({
      where: { family_id, user_id },
    });
    if (exists) throw new BadRequestException('Người này đã có trong gia đình');

    const member = this.memberRepository.create({
      family_id,
      user_id,
      role,
    });

    return this.memberRepository.save(member);
  }

  /** Get all members in a family */
  async getMembersByFamily(family_id: number) {
    return this.memberRepository.find({ where: { family_id } });
  }

  /** Get one member */
  async getMember(id: number) {
    const member = await this.memberRepository.findOne({ where: { id } }); // Tìm theo thứ tự bản ghi của bảng
    if (!member) throw new NotFoundException(`Không tìm thấy thành viên này`);
    return member;
  }

  // Đưa ra toàn bộ các gia đình
  async getMyFamily(userId: number) {
    const member = await this.memberRepository.find({ where: { user_id: userId } });
    if (member.length === 0) throw new NotFoundException(`Người này chưa thuộc bất kì gia đình nào`);
    return member;
  }

  /** Update member role */
  async updateMemberRole(
    id: number,
    role: string,
    user: JwtUser,
  ) {
    const member = await this.getMember(id);

    const family = await this.familyRepository.findOne({
      where: { id: member.family_id },
    });
    if (!family) throw new NotFoundException('Không tìm thấy nhóm gia đình');

    // Only family owner or admin can update
    if (family.owner_id !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('Bạn không có quyền thay đổi vai trò của người này');
    }

    member.role = role;
    return this.memberRepository.save(member);
  }

  /** Remove member */
  async removeMember(id: number, user: JwtUser) {
    const member = await this.getMember(id);

    const family = await this.familyRepository.findOne({
      where: { id: member.family_id },
    });
    if (!family) throw new NotFoundException('Family not found');

    // Only owner or admin
    if (family.owner_id !== user.id && user.role !== 'admin') {
      throw new ForbiddenException(
        'You cannot remove members from this family',
      );
    }

    await this.memberRepository.delete(id);
  }

  /**
   * Xóa member bằng ID (dùng cho tự rời nhóm, không cần permission check)
   */
  async removeMemberById(id: number) {
    const member = await this.memberRepository.findOne({ where: { id } });
    if (!member) {
      throw new NotFoundException('Không tìm thấy thành viên này');
    }
    await this.memberRepository.delete(id);
  }

  /**
   * Xóa tất cả members của một family (dùng khi xóa family)
   */
  async deleteAllMembersByFamily(family_id: number) {
    await this.memberRepository.delete({ family_id });
  }
}
