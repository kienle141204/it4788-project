import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from './entities/member.entity';
import { FamilyService } from '../family/family.service';
import { AddMemberDto } from './dto/add-member.dto';

type AuthUser = {
  id: number;
  role: string;
};

@Injectable()
export class MemberService {
  constructor(
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
    private readonly familyService: FamilyService,
  ) {}

  async addMember(dto: AddMemberDto, user: AuthUser): Promise<Member> {
    const { family_id, user_id, role } = dto;

    const family = await this.familyService.getFamilyById(family_id);

    // Admin OR family owner can add members
    if (family.owner_id !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('Not allowed to add members in this family');
    }

    const exists = await this.memberRepository.findOne({
      where: { family_id, user_id },
    });
    if (exists) throw new BadRequestException('User already in family');

    const member = this.memberRepository.create({ family_id, user_id, role });
    return this.memberRepository.save(member);
  }

  async getMembersByFamily(family_id: number) {
    return this.memberRepository.find({ where: { family_id } });
  }

  async getMember(id: number) {
    const member = await this.memberRepository.findOne({ where: { id } });
    if (!member) throw new NotFoundException(`Member ${id} not found`);
    return member;
  }

  async updateMemberRole(
    id: number,
    role: 'member' | 'manager',
    user: AuthUser,
  ) {
    const member = await this.getMember(id);
    const family = await this.familyService.getFamilyById(member.family_id);

    if (family.owner_id !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('Not allowed to update member roles');
    }

    member.role = role;
    return this.memberRepository.save(member);
  }

  async removeMember(id: number, user: AuthUser) {
    const member = await this.getMember(id);
    const family = await this.familyService.getFamilyById(member.family_id);

    if (family.owner_id !== user.id && user.role !== 'admin') {
      throw new ForbiddenException('Not allowed to remove member');
    }

    await this.memberRepository.delete(id);
  }
}
