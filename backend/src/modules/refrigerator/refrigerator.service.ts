import { Injectable, NotFoundException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Refrigerator } from '../../entities/refrigerator.entity';
import { CreateRefrigeratorDto } from './dto/create-refrigerator.dto';
import { UpdateRefrigeratorDto } from './dto/update-refrigerator.dto';
import type { JwtUser } from '../../common/types/user.type';
import { FamilyService } from '../family/family.service';

@Injectable()
export class RefrigeratorService {
  constructor(
    @InjectRepository(Refrigerator)
    private readonly refrigeratorRepo: Repository<Refrigerator>,

    private readonly familyService: FamilyService,
  ) { }

  // Tạo ra tủ lạnh cho gia đình nếu có family_id, cho cá nhân nếu không có 
  async create(dto: CreateRefrigeratorDto, user: JwtUser): Promise<Refrigerator> {
    // Nếu là admin => có quyền tạo cho bất kỳ family nào
    if (user.role === 'admin') {
      const fridge = this.refrigeratorRepo.create(dto);
      return await this.refrigeratorRepo.save(fridge);
    }

    // Nếu có family_id → kiểm tra quyền sở hữu
    if (dto.family_id) {
      const family = await this.familyService.getFamilyById(dto.family_id);

      // Người tạo phải là chủ của family
      if (family.owner_id !== user.id) {
        throw new UnauthorizedException('Bạn không thể tạo vì không phải là chủ hộ');
      }

      // Kiểm tra đã có tủ lạnh nào trong family chưa (1 family 1 tủ lạnh)
      const existing = await this.refrigeratorRepo.findOne({
        where: { family_id: dto.family_id },
      });

      if (existing) {
        throw new ConflictException('Tủ lạnh cho hộ này đã tồn tại');
      }
    }

    // Nếu có owner_id trong DTO mà khác user.id → chặn
    if (dto.owner_id && dto.owner_id !== user.id) {
      throw new UnauthorizedException('Bạn không thể gán chủ sở hữu khác chính mình');
    }

    // Tạo mới
    const fridge = this.refrigeratorRepo.create({
      ...dto,
      owner_id: user.id, // đảm bảo người tạo là chủ (trừ khi admin)
    });

    return await this.refrigeratorRepo.save(fridge);
  }

  // Đưa ra toàn bộ tủ lạnh (admin)
  async findAll(): Promise<Refrigerator[]> {
    return await this.refrigeratorRepo.find({ relations: ['owner', 'family'] });
  }

  // Đưa ra tủ lạnh có id, chỉ có thành viên trong gia đình mới xem được
  async findOne(id: number, user: JwtUser): Promise<Refrigerator> {
    const fridge = await this.refrigeratorRepo.findOne({
      where: { id },
      relations: ['owner', 'family', 'family.members'], // đảm bảo members được load
    });

    if (!fridge) throw new NotFoundException(`Không tìm thấy tủ lạnh`);

    // Kiểm tra quyền: admin hoặc owner hoặc member family
    const isOwner = fridge.owner_id === user.id;
    const isMember = fridge.family?.members?.some(member => member.id === user.id);
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isMember && !isAdmin) {
      throw new UnauthorizedException('Bạn không có quyền xem');
    }

    return fridge;
  }

  // Đưa ra các tủ lạnh mình sở hữu
  async myFridge(user: JwtUser): Promise<Refrigerator> {
    const fridge = await this.refrigeratorRepo.findOne({
      where: { owner_id: user.id },
      relations: ['owner', 'family', 'family.members'],
    });

    if (!fridge) throw new NotFoundException(`Bạn chưa có tủ lạnh`);
    return fridge;
  }

  // Đưa ra tủ lạnh của cùng gia đình có id
  async myFamilyFridge(family_id: number, user: JwtUser): Promise<Refrigerator> {
    const fridge = await this.refrigeratorRepo.findOne({
      where: { family_id },
      relations: ['owner', 'family', 'family.members'],
    });

    if (!fridge) throw new NotFoundException(`Không tìm thấy tủ lạnh`);

    const isOwner = fridge.owner_id === user.id;
    const isMember = fridge.family?.members?.some(member => member.id === user.id) ?? false;
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isMember && !isAdmin) {
      throw new UnauthorizedException('Bạn không có quyền xem');
    }

    return fridge;
  }

  // Cập nhật
  async update(id: number, dto: UpdateRefrigeratorDto, user: JwtUser): Promise<Refrigerator> {
    const fridge = await this.findOne(id, user);
    Object.assign(fridge, dto);
    return await this.refrigeratorRepo.save(fridge);
  }

  async remove(id: number, user: JwtUser): Promise<void> {
    // Lấy tủ lạnh (không cần check family member nữa)
    const fridge = await this.refrigeratorRepo.findOne({
      where: { id },
      relations: ['owner'], // chỉ load owner là đủ
    });

    if (!fridge) {
      throw new NotFoundException(`Refrigerator #${id} not found`);
    }

    // Kiểm tra quyền: admin hoặc owner
    const isOwner = fridge.owner_id === user.id;
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new UnauthorizedException('Bạn không có quyền xóa tủ lạnh này');
    }

    await this.refrigeratorRepo.remove(fridge);
  }

}
