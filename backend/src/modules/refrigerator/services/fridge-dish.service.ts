import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ResponseCode, ResponseMessageVi } from 'src/common/errors/error-codes';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FridgeDish } from '../../../entities/fridge-dish.entity';
import { Refrigerator } from '../../../entities/refrigerator.entity';
import { Dish } from '../../../entities/dish.entity';
import { CreateFridgeDishDto } from '../dto/create-fridge-dish.dto';
import { UpdateFridgeDishDto } from '../dto/update-fridge-dish.dto';
import { PaginationDto } from '../dto/pagination.dto';
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
  async create(refrigerator_id: number, dto: CreateFridgeDishDto, user: JwtUser): Promise<FridgeDish> {
    const { dish_id, ...data } = dto; // destructure dto

    // Kiểm tra refrigerator tồn tại
    const fridge = await this.refrigeratorRepo.findOne({
      where: { id: refrigerator_id },
      relations: ['owner', 'family', 'family.members'], // cần load members
    });
    if (!fridge) throw new NotFoundException(ResponseMessageVi[ResponseCode.C00230]);

    // Kiểm tra quyền: admin, owner, family owner, hoặc member family
    const isOwner = fridge.owner_id === user.id;
    const isAdmin = user.role === 'admin';
    const isFamilyOwner = fridge.family?.owner_id === user.id;
    const isFamilyMember = fridge.family?.members?.some(member => member.user_id === user.id) ?? false;

    if (!isOwner && !isAdmin && !isFamilyOwner && !isFamilyMember) {
      throw new UnauthorizedException(ResponseMessageVi[ResponseCode.C00235]);
    }

    // Kiểm tra dish tồn tại
    const dish = await this.dishRepo.findOne({ where: { id: dish_id } });
    if (!dish) throw new NotFoundException(ResponseMessageVi[ResponseCode.C00100]);

    // Tạo FridgeDish
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
      relations: ['refrigerator', 'dish', 'refrigerator.family', 'refrigerator.family.members'],
    });
    if (!item) throw new NotFoundException(ResponseMessageVi[ResponseCode.C00237]);

    const fridge = item.refrigerator;
    const isOwner = fridge.owner_id === user.id;
    const isAdmin = user.role === 'admin';
    const isFamilyOwner = fridge.family?.owner_id === user.id;
    const isFamilyMember = fridge.family?.members?.some(m => m.user_id === user.id) ?? false;

    if (!isOwner && !isAdmin && !isFamilyOwner && !isFamilyMember) {
      throw new UnauthorizedException(ResponseMessageVi[ResponseCode.C00234]);
    }

    return item;
  }

  /** Lấy tất cả món ăn trong tủ lạnh với phân trang */
  async findByRefrigerator(fridge_id: number, user: JwtUser, paginationDto: PaginationDto): Promise<{
    data: FridgeDish[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Kiểm tra quyền truy cập tủ lạnh
    const fridge = await this.refrigeratorRepo.findOne({
      where: { id: fridge_id },
      relations: ['owner', 'family', 'family.members'],
    });

    if (!fridge) throw new NotFoundException(`Không tìm thấy tủ lạnh`);

    const isOwner = fridge.owner_id === user.id;
    const isAdmin = user.role === 'admin';
    const isFamilyOwner = fridge.family?.owner_id === user.id;
    const isFamilyMember = fridge.family?.members?.some(m => m.user_id === user.id) ?? false;

    if (!isOwner && !isAdmin && !isFamilyOwner && !isFamilyMember) {
      throw new UnauthorizedException('Bạn không có quyền truy cập tủ lạnh này');
    }

    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.fridgeDishRepo.findAndCount({
      where: { refrigerator_id: fridge_id },
      relations: ['refrigerator', 'dish', 'refrigerator.family', 'refrigerator.family.members'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /** Cập nhật món ăn */
  async update(id: number, dto: UpdateFridgeDishDto, user: JwtUser): Promise<FridgeDish> {
    const item = await this.findOne(id, user); // đã check quyền
    Object.assign(item, dto);
    return await this.fridgeDishRepo.save(item);
  }

  /** Xóa món ăn */
  async remove(id: number, user: JwtUser): Promise<void> {
    const item = await this.findOne(id, user); // đã check quyền
    await this.fridgeDishRepo.remove(item);
  }

}
