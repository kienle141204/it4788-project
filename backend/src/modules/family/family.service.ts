import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Family } from '../../entities/family.entity';
import { MemberService } from '../member/member.service';
import { AddMemberDto } from '../member/dto/add-member.dto';
import type { JwtUser } from 'src/common/types/user.type';

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
      relations: ['members'],
    });
    if (!family) throw new NotFoundException(`Không tìm thấy gia đình ${id}`);
    return family;
  }

  private ensureOwnerOrAdmin(family: Family, userId: number, role: string) {
    if (family.owner_id !== userId && role !== 'admin') {
      throw new ForbiddenException('Bạn không phải chủ hay admin');
    }
  }

  async createFamily(name: string, ownerId: number, user: JwtUser): Promise<Family> {
    const family = this.familyRepository.create({ name, owner_id: ownerId });
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
      relations: ['members'],
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
      relations: ['members'],
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

    await this.familyRepository.delete(id);
  }
}
