import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FridgeDish } from '../../../entities/fridge-dish.entity';
import { Refrigerator } from '../../../entities/refrigerator.entity';
import { Dish } from '../../../entities/dish.entity';
import { CreateFridgeDishDto } from '../dto/create-fridge-dish.dto';
import { UpdateFridgeDishDto } from '../dto/update-fridge-dish.dto';
import { JwtUser } from '../../../common/types/user.type';

@Injectable()
export class FridgeDishService {
  constructor(
    @InjectRepository(FridgeDish)
    private readonly fridgeDishRepo: Repository<FridgeDish>,
    @InjectRepository(Refrigerator)
    private readonly refrigeratorRepo: Repository<Refrigerator>,
    @InjectRepository(Dish)
    private readonly dishRepo: Repository<Dish>,
  ) { }

  /** Tạo mới món ăn trong tủ lạnh */
  async create(dto: CreateFridgeDishDto, user: JwtUser): Promise<FridgeDish> {
    const { refrigerator_id, dish_id, ...data } = dto;

    // Kiểm tra refrigerator tồn tại
    const fridge = await this.refrigeratorRepo.findOne({
      where: { id: refrigerator_id },
      relations: ['owner', 'family'],
    });
    if (!fridge) throw new NotFoundException(`Không tìm thấy refrigerator ${refrigerator_id}`);

    // Kiểm tra quyền
    const isFamilyOwner = fridge.family && fridge.family.owner_id === user.id;
    if (fridge.owner_id !== user.id && user.role !== 'admin' && !isFamilyOwner) {
      throw new UnauthorizedException('Bạn không có quyền thêm món ăn vào tủ này');
    }

    // Kiểm tra dish tồn tại
    const dish = await this.dishRepo.findOne({ where: { id: dish_id } });
    if (!dish) throw new NotFoundException(`Không tìm thấy dish ${dish_id}`);

    const fridgeDish = this.fridgeDishRepo.create({
      refrigerator_id,
      dish_id,
      ...data,
    });

    return await this.fridgeDishRepo.save(fridgeDish);
  }

  /** Lấy toàn bộ món ăn trong tủ lạnh */
  async findAll(): Promise<FridgeDish[]> {
    return this.fridgeDishRepo.find({
      relations: ['refrigerator', 'dish'],
      order: { created_at: 'DESC' },
    });
  }

  /** Lấy 1 món ăn cụ thể */
  async findOne(id: number, user: JwtUser): Promise<FridgeDish> {
    const item = await this.fridgeDishRepo.findOne({
      where: { id },
      relations: ['refrigerator', 'dish', 'refrigerator.family'],
    });
    if (!item) throw new NotFoundException(`FridgeDish ${id} not found`);

    const fridge = item.refrigerator;
    const isFamilyOwner = fridge.family && fridge.family.owner_id === user.id;
    if (fridge.owner_id !== user.id && user.role !== 'admin' && !isFamilyOwner) {
      throw new UnauthorizedException('Bạn không có quyền truy cập món ăn này');
    }

    return item;
  }

  async findByRefrigerator(id: number, user: JwtUser): Promise<FridgeDish> {
    const item = await this.fridgeDishRepo.findOne({
      where: { id },
      relations: ['refrigerator', 'dish', 'refrigerator.family'],
    });
    if (!item) throw new NotFoundException(`FridgeDish ${id} not found`);

    const fridge = item.refrigerator;
    const isFamilyOwner = fridge.family && fridge.family.owner_id === user.id;
    if (fridge.owner_id !== user.id && user.role !== 'admin' && !isFamilyOwner) {
      throw new UnauthorizedException('Bạn không có quyền truy cập món ăn này');
    }

    return item;
  }

  /** Cập nhật món ăn */
  async update(id: number, dto: UpdateFridgeDishDto, user: JwtUser): Promise<FridgeDish> {
    const item = await this.findOne(id, user);
    Object.assign(item, dto);
    return await this.fridgeDishRepo.save(item);
  }

  /** Xóa món ăn */
  async remove(id: number, user: JwtUser): Promise<void> {
    const item = await this.findOne(id, user);
    await this.fridgeDishRepo.remove(item);
  }
}
