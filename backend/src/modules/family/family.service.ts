import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Family } from './entities/family.entity';
import { MemberService } from '../member/member.service';

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
    if (!family) throw new NotFoundException(`Family ${id} not found`);
    return family;
  }

  private ensureOwnerOrAdmin(family: Family, userId: number, role: string) {
    if (family.owner_id !== userId && role !== 'admin') {
      throw new ForbiddenException('You are not allowed to do this action');
    }
  }

  async createFamily(name: string, ownerId: number, user): Promise<Family> {
    const family = this.familyRepository.create({ name, owner_id: ownerId });
    const saved = await this.familyRepository.save(family);
    await this.memberService.addMember(
      { family_id: saved.id, user_id: ownerId, role: 'manager' },
      ownerId,
      user.role,
    );

    return saved;
  }

  async getAllFamilies() {
    return this.familyRepository.find();
  }

  async getFamilyById(id: number) {
    return this.findFamilyOrFail(id);
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
