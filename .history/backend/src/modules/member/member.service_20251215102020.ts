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

    const member = this.memberRepository.create({
      family_id,
      user_id,
      role,
    });

    const savedMember = await this.memberRepository.save(member);

    // Tạo thông báo cho tất cả thành viên trong nhóm và người được thêm
    try {
      // Lấy thông tin user được thêm
      const addedUser = await this.userRepository.findOne({
        where: { id: user_id },
      });
      const addedUserName = addedUser?.full_name || `User ${user_id}`;

      // Lấy thông tin user thêm (người thực hiện)
      const adderUser = await this.userRepository.findOne({
        where: { id: user.id },
      });
      const adderUserName = adderUser?.full_name || `User ${user.id}`;

      // Lấy tất cả thành viên trong nhóm (bao gồm cả người vừa được thêm)
      const allMembers = await this.memberRepository.find({
        where: { family_id },
      });

      // Gửi thông báo cho tất cả thành viên trong nhóm
      for (const memberItem of allMembers) {
        if (memberItem.user_id === user_id) {
          // Thông báo cho người được thêm
          await this.notificationsService.createNotification(
            memberItem.user_id,
            'Tham gia nhóm thành công',
            `Chúc mừng bạn đã trở thành thành viên của nhóm ${family.name}`,
          );
        } else {
          // Thông báo cho các thành viên khác
          await this.notificationsService.createNotification(
            memberItem.user_id,
            'Thành viên mới',
            `${addedUserName} đã được ${adderUserName} thêm vào nhóm ${family.name}`,
          );
        }
      }

      // Gửi thông báo cho người thêm (nếu chưa phải là thành viên)
      if (user.id !== user_id) {
        const adderMember = allMembers.find(m => m.user_id === user.id);
        if (!adderMember) {
          // Nếu người thêm không phải là thành viên (có thể là admin), gửi thông báo cho owner
          await this.notificationsService.createNotification(
            family.owner_id,
            'Thành viên mới',
            `${addedUserName} đã được ${adderUserName} thêm vào nhóm ${family.name}`,
          );
        }
      }
    } catch (error) {
      // Log lỗi nhưng không throw để không ảnh hưởng đến việc thêm thành viên
      console.error('Error creating notifications for add member:', error);
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

    const savedMember = await this.memberRepository.save(member);

    // Tạo thông báo cho tất cả thành viên trong nhóm và người được thêm
    try {
      // Lấy thông tin user được thêm
      const addedUser = await this.userRepository.findOne({
        where: { id: user_id },
      });
      const addedUserName = addedUser?.full_name || `User ${user_id}`;

      // Lấy tất cả thành viên trong nhóm (bao gồm cả người vừa được thêm)
      const allMembers = await this.memberRepository.find({
        where: { family_id },
      });

      // Gửi thông báo cho tất cả thành viên trong nhóm
      for (const memberItem of allMembers) {
        if (memberItem.user_id === user_id) {
          // Thông báo cho người được thêm
          await this.notificationsService.createNotification(
            memberItem.user_id,
            'Tham gia nhóm thành công',
            `Chúc mừng bạn đã trở thành thành viên của nhóm ${family.name}`,
          );
        } else {
          // Thông báo cho các thành viên khác
          await this.notificationsService.createNotification(
            memberItem.user_id,
            'Thành viên mới',
            `${addedUserName} đã tham gia nhóm ${family.name}`,
          );
        }
      }
    } catch (error) {
      // Log lỗi nhưng không throw để không ảnh hưởng đến việc thêm thành viên
      console.error('Error creating notifications for add member by invitation:', error);
    }

    return savedMember;
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
    const removedUserId = member.user_id;

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

    // Lấy thông tin user rời nhóm trước khi xóa
    const removedUser = await this.userRepository.findOne({
      where: { id: removedUserId },
    });
    const removedUserName = removedUser?.full_name || `User ${removedUserId}`;

    // Lấy tất cả thành viên còn lại trong nhóm (trước khi xóa)
    const allMembers = await this.memberRepository.find({
      where: { family_id: member.family_id },
    });

    console.log(`[removeMember] Found ${allMembers.length} members before removal. Removed user ID: ${removedUserId}`);

    // Xóa thành viên
    await this.memberRepository.delete(id);

    // Tạo thông báo cho tất cả thành viên còn lại trong nhóm
    try {
      if (!this.notificationsService) {
        console.error('[removeMember] notificationsService is not injected!');
        return;
      }

      const remainingMembers = allMembers.filter(m => m.user_id !== removedUserId);
      console.log(`[removeMember] Sending notifications to ${remainingMembers.length} remaining members`);
      
      if (remainingMembers.length === 0) {
        console.log(`[removeMember] No remaining members to notify`);
        return;
      }
      
      for (const memberItem of remainingMembers) {
        console.log(`[removeMember] Creating notification for user ${memberItem.user_id}`);
        console.log(`[removeMember] Notification title: "Thành viên rời nhóm"`);
        console.log(`[removeMember] Notification body: "${removedUserName} đã rời nhóm ${family.name}"`);
        // Gửi thông báo cho các thành viên còn lại
        try {
          const notification = await this.notificationsService.createNotification(
            memberItem.user_id,
            'Thành viên rời nhóm',
            `${removedUserName} đã rời nhóm ${family.name}`,
          );
          console.log(`[removeMember] ✅ Notification created successfully for user ${memberItem.user_id}, notification ID: ${notification.id}`);
        } catch (notifError) {
          console.error(`[removeMember] ❌ Failed to create notification for user ${memberItem.user_id}:`, notifError);
          throw notifError; // Re-throw để xem lỗi chi tiết
        }
      }
      console.log(`[removeMember] All notifications created successfully`);
    } catch (error) {
      // Log lỗi chi tiết để debug
      console.error('[removeMember] Error creating notifications:', error);
      console.error('[removeMember] Error stack:', error.stack);
      console.error('[removeMember] Error details:', JSON.stringify(error, null, 2));
    }
  }

  /**
   * Xóa member theo ID (dùng khi user tự rời nhóm)
   * Không cần permission check vì đã được kiểm tra ở service gọi
   */
  async removeMemberById(id: number) {
    const member = await this.getMember(id);
    const removedUserId = member.user_id;

    const family = await this.familyRepository.findOne({
      where: { id: member.family_id },
    });
    if (!family) throw new NotFoundException('Family not found');

    // Lấy thông tin user rời nhóm trước khi xóa
    const removedUser = await this.userRepository.findOne({
      where: { id: removedUserId },
    });
    const removedUserName = removedUser?.full_name || `User ${removedUserId}`;

    // Lấy tất cả thành viên còn lại trong nhóm (trước khi xóa)
    const allMembers = await this.memberRepository.find({
      where: { family_id: member.family_id },
    });

    console.log(`[removeMemberById] Found ${allMembers.length} members before removal. Removed user ID: ${removedUserId}`);

    // Xóa thành viên
    await this.memberRepository.delete(id);

    // Tạo thông báo cho tất cả thành viên còn lại trong nhóm
    try {
      if (!this.notificationsService) {
        console.error('[removeMemberById] notificationsService is not injected!');
        return;
      }

      const remainingMembers = allMembers.filter(m => m.user_id !== removedUserId);
      console.log(`[removeMemberById] Sending notifications to ${remainingMembers.length} remaining members`);
      
      if (remainingMembers.length === 0) {
        console.log(`[removeMemberById] No remaining members to notify`);
        return;
      }
      
      for (const memberItem of remainingMembers) {
        console.log(`[removeMemberById] Creating notification for user ${memberItem.user_id}`);
        // Gửi thông báo cho các thành viên còn lại
        const notification = await this.notificationsService.createNotification(
          memberItem.user_id,
          'Thành viên rời nhóm',
          `${removedUserName} đã rời nhóm ${family.name}`,
        );
        console.log(`[removeMemberById] Notification created successfully for user ${memberItem.user_id}, notification ID: ${notification.id}`);
      }
      console.log(`[removeMemberById] All notifications created successfully`);
    } catch (error) {
      // Log lỗi chi tiết để debug
      console.error('[removeMemberById] Error creating notifications:', error);
      console.error('[removeMemberById] Error stack:', error.stack);
      console.error('[removeMemberById] Error details:', JSON.stringify(error, null, 2));
    }
  }

  async deleteAllMembersByFamily(family_id: number): Promise<void> {
    await this.memberRepository.delete({ family_id });
  }
}
