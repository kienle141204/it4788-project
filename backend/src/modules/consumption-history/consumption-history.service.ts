import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { ConsumptionHistory } from '../../entities/consumption-history.entity';
import { CreateConsumptionHistoryDto } from './dto/create-consumption-history.dto';
import { UpdateConsumptionHistoryDto } from './dto/update-consumption-history.dto';
import type { JwtUser } from 'src/common/types/user.type';

@Injectable()
export class ConsumptionHistoryService {
  constructor(
    @InjectRepository(ConsumptionHistory)
    private readonly consumptionRepo: Repository<ConsumptionHistory>,
  ) { }

  private checkPermission(user: JwtUser, targetUserId?: number) {
    if (user.role === 'admin') return;
    if (targetUserId && user.id !== targetUserId) {
      throw new ForbiddenException('You do not have permission to access this data');
    }
  }

  async create(dto: CreateConsumptionHistoryDto, user: JwtUser) {
    this.checkPermission(user, dto.user_id);
    const record = this.consumptionRepo.create(dto);
    return await this.consumptionRepo.save(record);
  }

  async findAll(user: JwtUser) {
    if (user.role !== 'admin') {
      // normal user chỉ xem dữ liệu của mình
      return this.consumptionRepo.find({ where: { user_id: user.id }, order: { created_at: 'DESC' } });
    }
    return this.consumptionRepo.find({ order: { created_at: 'DESC' } });
  }

  async findOne(id: number, user: JwtUser) {
    const record = await this.consumptionRepo.findOne({ where: { id } });
    if (!record) throw new NotFoundException('Consumption record not found');
    this.checkPermission(user, record.user_id);
    return record;
  }

  async update(id: number, dto: UpdateConsumptionHistoryDto, user: JwtUser) {
    const record = await this.findOne(id, user);
    Object.assign(record, dto);
    return this.consumptionRepo.save(record);
  }

  async remove(id: number, user: JwtUser) {
    const record = await this.findOne(id, user);
    return this.consumptionRepo.remove(record);
  }

  async logConsumption(dto: CreateConsumptionHistoryDto, user: JwtUser) {
    this.checkPermission(user, dto.user_id);
    const entry = this.consumptionRepo.create(dto);
    return this.consumptionRepo.save(entry);
  }

  async monthlyStatistics(year: number, userId: number, user: JwtUser) {
    this.checkPermission(user, userId);
    const start = new Date(year, 0, 1);
    const records = await this.consumptionRepo.find({
      where: { user_id: userId, created_at: MoreThanOrEqual(start) },
    });
    const monthMap = new Map<string, number>();
    records.forEach(r => {
      const month = r.created_at.toISOString().slice(0, 7);
      monthMap.set(month, (monthMap.get(month) || 0) + r.stock);
    });
    return Array.from(monthMap.entries())
      .map(([month, total_consumed]) => ({ month, total_consumed }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  async topConsumed(type: 'dish' | 'ingredient', limit = 5, user: JwtUser, userId?: number) {
    if (userId) this.checkPermission(user, userId);
    const where: any = { consume_type: type };
    if (userId) where.user_id = userId;

    const records = await this.consumptionRepo.find({ where });

    const map = new Map<number, number>();
    records.forEach(r => map.set(r.item_id, (map.get(r.item_id) || 0) + r.stock));

    return Array.from(map.entries())
      .map(([id, total]) => ({ id, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  }

  async statisticsByUser(userId: number, user: JwtUser) {
    this.checkPermission(user, userId);
    const records = await this.consumptionRepo.find({ where: { user_id: userId } });
    const total_consumed = records.reduce((sum, r) => sum + r.stock, 0);
    return { total_consumed };
  }

  async statisticsByFamily(familyId: number, user: JwtUser) {
    if (user.role !== 'admin') {
      throw new ForbiddenException('You do not have permission to access family statistics');
    }
    const records = await this.consumptionRepo.find({ where: { family_id: familyId } });
    const total_consumed = records.reduce((sum, r) => sum + r.stock, 0);
    return { total_consumed };
  }
}
