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

    try {
      const addedUser = await this.userRepository.findOne({
        where: { id: user_id },
      });
      const addedUserName = addedUser?.full_name || `User ${user_id}`;

      const adderUser = await this.userRepository.findOne({
        where: { id: user.id },
      });
      const adderUserName = adderUser?.full_name || `User ${user.id}`;

      const allMembers = await this.memberRepository.find({
        where: { family_id },
      });

      for (const memberItem of allMembers) {
        if (memberItem.user_id === user_id) {
          await this.notificationsService.createNotification(
            memberItem.user_id,
            'Tham gia nhóm thành công',
            `Chúc mừng bạn đã trở thành thành viên của nhóm ${family.name}`,
          );
        } else {
          await this.notificationsService.createNotification(
            memberItem.user_id,
            'Thành viên mới',
            `${addedUserName} đã được ${adderUserName} thêm vào nhóm ${family.name}`,
          );
        }
      }

      if (user.id !== user_id) {
        const adderMember = allMembers.find(m => m.user_id === user.id);
        if (!adderMember) {
          await this.notificationsService.createNotification(
            family.owner_id,
            'Thành viên mới',
            `${addedUserName} đã được ${adderUserName} thêm vào nhóm ${family.name}`,
          );
        }
      }
    } catch (error) {
    }

    return savedMember;
  }

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

    try {
      const addedUser = await this.userRepository.findOne({
        where: { id: user_id },
      });
      const addedUserName = addedUser?.full_name || `User ${user_id}`;

      const allMembers = await this.memberRepository.find({
        where: { family_id },
      });

      for (const memberItem of allMembers) {
        if (memberItem.user_id === user_id) {
          await this.notificationsService.createNotification(
            memberItem.user_id,
            'Tham gia nhóm thành công',
            `Chúc mừng bạn đã trở thành thành viên của nhóm ${family.name}`,
          );
        } else {
          await this.notificationsService.createNotification(
            memberItem.user_id,
            'Thành viên mới',
            `${addedUserName} đã tham gia nhóm ${family.name}`,
          );
        }
      }
    } catch (error) {
    }

    return savedMember;
  }

  async getMembersByFamily(family_id: number) {
    return this.memberRepository.find({ where: { family_id } });
  }

  async getMember(id: number) {
    const member = await this.memberRepository.findOne({ where: { id } });
    if (!member) throw new NotFoundException(`Không tìm thấy thành viên này`);
    return member;
  }

  async getMyFamily(userId: number) {
    const member = await this.memberRepository.find({ where: { user_id: userId } });
    if (member.length === 0) throw new NotFoundException(`Người này chưa thuộc bất kì gia đình nào`);
    return member;
  }

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

    if (family.owner_id !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('Bạn không có quyền thay đổi vai trò của người này');
    }

    member.role = role;
    return this.memberRepository.save(member);
  }

  async removeMember(id: number, user: JwtUser) {
    const member = await this.getMember(id);
    const removedUserId = member.user_id;

    const family = await this.familyRepository.findOne({
      where: { id: member.family_id },
    });
    if (!family) throw new NotFoundException('Family not found');

    if (family.owner_id !== user.id && user.role !== 'admin') {
      throw new ForbiddenException(
        'You cannot remove members from this family',
      );
    }

    const removedUser = await this.userRepository.findOne({
      where: { id: removedUserId },
    });
    const removedUserName = removedUser?.full_name || `User ${removedUserId}`;

    const allMembers = await this.memberRepository.find({
      where: { family_id: member.family_id },
    });

    await this.memberRepository.delete(id);

    try {
      if (!this.notificationsService) {
        return;
      }

      const remainingMembers = allMembers.filter(m => m.user_id !== removedUserId);
      
      if (remainingMembers.length === 0) {
        return;
      }
      
      for (const memberItem of remainingMembers) {
        await this.notificationsService.createNotification(
          memberItem.user_id,
          'Thành viên rời nhóm',
          `${removedUserName} đã rời nhóm ${family.name}`,
        );
      }
    } catch (error) {
      console.error('Error creating notifications for remove member:', error);
    }
  }

  async removeMemberById(id: number) {
    const member = await this.getMember(id);
    const removedUserId = member.user_id;

    const family = await this.familyRepository.findOne({
      where: { id: member.family_id },
    });
    if (!family) throw new NotFoundException('Family not found');

    const removedUser = await this.userRepository.findOne({
      where: { id: removedUserId },
    });
    const removedUserName = removedUser?.full_name || `User ${removedUserId}`;

    const allMembers = await this.memberRepository.find({
      where: { family_id: member.family_id },
    });

    await this.memberRepository.delete(id);

    try {
      if (!this.notificationsService) {
        return;
      }

      const remainingMembers = allMembers.filter(m => m.user_id !== removedUserId);
      
      if (remainingMembers.length === 0) {
        return;
      }
      
      for (const memberItem of remainingMembers) {
        await this.notificationsService.createNotification(
          memberItem.user_id,
          'Thành viên rời nhóm',
          `${removedUserName} đã rời nhóm ${family.name}`,
        );
      }
    } catch (error) {
      console.error('Error creating notifications for remove member:', error);
    }
  }

  async deleteAllMembersByFamily(family_id: number): Promise<void> {
    await this.memberRepository.delete({ family_id });
  }
}
