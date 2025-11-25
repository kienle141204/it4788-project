import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsumptionHistory } from '../../entities/consumption-history.entity';
import { CreateConsumptionHistoryDto } from './dto/create-consumption-history.dto';
import { UpdateConsumptionHistoryDto } from './dto/update-consumption-history.dto';

@Injectable()
export class ConsumptionHistoryService {
  constructor(
    @InjectRepository(ConsumptionHistory)
    private readonly consumptionRepo: Repository<ConsumptionHistory>,
  ) { }

  async create(dto: CreateConsumptionHistoryDto) {
    const record = this.consumptionRepo.create(dto);
    return await this.consumptionRepo.save(record);
  }

  async findAll() {
    return await this.consumptionRepo.find({
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number) {
    const record = await this.consumptionRepo.findOne({ where: { id } });
    if (!record) throw new NotFoundException('Consumption record not found');
    return record;
  }

  async update(id: number, dto: UpdateConsumptionHistoryDto) {
    const record = await this.findOne(id);
    Object.assign(record, dto);
    return await this.consumptionRepo.save(record);
  }

  async remove(id: number) {
    const record = await this.findOne(id);
    return await this.consumptionRepo.remove(record);
  }
  /** Ghi log tiêu thụ */
  async logConsumption(data: {
    user_id: number;
    family_id?: number;
    consume_type: 'dish' | 'ingredient';
    stock: number;
  }) {
    const entry = this.consumptionRepo.create(data);
    return this.consumptionRepo.save(entry);
  }

  /** Thống kê theo tháng */
  async monthlyStatistics(year: number, userId: number) {
    return this.consumptionRepo
      .createQueryBuilder('c')
      .select("DATE_TRUNC('month', c.created_at)", 'month')
      .addSelect('SUM(c.stock)', 'total_consumed')
      .where('c.user_id = :userId', { userId })
      .andWhere('EXTRACT(YEAR FROM c.created_at) = :year', { year })
      .groupBy("DATE_TRUNC('month', c.created_at)")
      .orderBy("DATE_TRUNC('month', c.created_at)", 'ASC')
      .getRawMany();
  }

  /** Top nguyên liệu / món tiêu thụ */
  async topConsumed(type: 'dish' | 'ingredient', limit = 5, userId?: number) {
    const qb = this.consumptionRepo
      .createQueryBuilder('c')
      .select('c.consume_type', 'type')
      .addSelect('c.consume_type = :type', 'filter_type')
      .addSelect('c.consume_type_id', 'id') // cần thêm column consume_type_id nếu muốn group by
      .addSelect('SUM(c.stock)', 'total')
      .where('c.consume_type = :type', { type });

    if (userId) {
      qb.andWhere('c.user_id = :userId', { userId });
    }

    return qb.groupBy('c.consume_type_id')
      .orderBy('total', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  /** Thống kê theo user */
  async statisticsByUser(userId: number) {
    const total = await this.consumptionRepo
      .createQueryBuilder('c')
      .select('SUM(c.stock)', 'total')
      .where('c.user_id = :userId', { userId })
      .getRawOne();
    return { total_consumed: Number(total.total || 0) };
  }

  /** Thống kê theo family */
  async statisticsByFamily(familyId: number) {
    const total = await this.consumptionRepo
      .createQueryBuilder('c')
      .select('SUM(c.stock)', 'total')
      .where('c.family_id = :familyId', { familyId })
      .getRawOne();
    return { total_consumed: Number(total.total || 0) };
  }
}
