import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FamilyMember } from '../../entities/family-member.entity';
import { Family } from '../../entities/family.entity';
import { AddMemberDto } from './dto/add-member.dto';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum FamilyMemberRole {
  MEMBER = 'member',
  MANAGER = 'manager',
}

@Injectable()
export class MemberService {
  constructor(
    @InjectRepository(FamilyMember)
    private readonly memberRepository: Repository<FamilyMember>,

    @InjectRepository(Family)
    private readonly familyRepository: Repository<Family>,
  ) { }

  /** ➕ Add member */
  async addMember(
    dto: AddMemberDto,
    userId: number,
    userRole: UserRole,
  ): Promise<FamilyMember> {
    const { family_id, user_id, role } = dto;

    const family = await this.familyRepository.findOne({
      where: { id: family_id },
    });
    if (!family) throw new NotFoundException(`Family ${family_id} not found`);

    // ✅ Only family owner or admin can add members
    if (family.owner_id !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You cannot add members to this family');
    }

    const exists = await this.memberRepository.findOne({
      where: { family_id, user_id },
    });
    if (exists) throw new BadRequestException('User already in family');

    const member = this.memberRepository.create({
      family_id,
      user_id,
      role,
    });

    return this.memberRepository.save(member);
  }

  /** 👀 Get all members in a family */
  async getMembersByFamily(family_id: number) {
    return this.memberRepository.find({ where: { family_id } });
  }

  /** 👤 Get one member */
  async getMember(id: number) {
    const member = await this.memberRepository.findOne({ where: { id } });
    if (!member) throw new NotFoundException(`Member ${id} not found`);
    return member;
  }

  /** ✏️ Update member role */
  async updateMemberRole(
    id: number,
    role: FamilyMemberRole,
    userId: number,
    userRole: UserRole,
  ) {
    const member = await this.getMember(id);

    const family = await this.familyRepository.findOne({
      where: { id: member.family_id },
    });
    if (!family) throw new NotFoundException('Family not found');

    // ✅ Only family owner or admin can update
    if (family.owner_id !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You cannot update roles in this family');
    }

    member.role = role;
    return this.memberRepository.save(member);
  }

  /** ❌ Remove member */
  async removeMember(id: number, userId: number, userRole: UserRole) {
    const member = await this.getMember(id);

    const family = await this.familyRepository.findOne({
      where: { id: member.family_id },
    });
    if (!family) throw new NotFoundException('Family not found');

    // ✅ Only owner or admin
    if (family.owner_id !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'You cannot remove members from this family',
      );
    }

    await this.memberRepository.delete(id);
  }
}
