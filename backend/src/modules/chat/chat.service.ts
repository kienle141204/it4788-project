import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from '../../entities/chat.entity';
import { CreateChatDto } from './dto/create-chat.dto';
import { FamilyService } from '../family/family.service';
import type { JwtUser } from 'src/common/types/user.type';
import { ResponseCode, ResponseMessageVi } from 'src/common/errors/error-codes';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private readonly chatRepo: Repository<Chat>,
    private readonly familyService: FamilyService,
  ) { }

  async create(user: JwtUser, dto: CreateChatDto) {
    await this.checkPermission(dto.familyId, user);

    const chat = this.chatRepo.create({
      userId: user.id,
      title: dto.title,
      message: dto.message,
      data: dto.data,
      familyId: dto.familyId,
    });

    return await this.chatRepo.save(chat);
  }

  async findByFamily(familyId: number, user: JwtUser, limit: number = 30, lastId?: number) {
    await this.checkPermission(familyId, user);

    const queryBuilder = this.chatRepo.createQueryBuilder('chat')
      .where('chat.familyId = :familyId', { familyId })
      .orderBy('chat.createdAt', 'DESC')
      .take(limit);

    // Cursor-based pagination: load messages older than lastId
    if (lastId) {
      queryBuilder.andWhere('chat.id < :lastId', { lastId });
    }

    const messages = await queryBuilder.getMany();

    // Check if there are more messages
    const hasMore = messages.length === limit;

    return {
      data: messages,
      pagination: {
        limit,
        lastId: messages.length > 0 ? messages[messages.length - 1].id : null,
        hasMore,
      },
    };
  }

  async markAsRead(id: number, user: JwtUser) {
    const chat = await this.chatRepo.findOne({ where: { id } });
    if (!chat) throw new NotFoundException(ResponseMessageVi[ResponseCode.C00350]);

    await this.checkPermission(chat.familyId, user);

    chat.isRead = true;
    return this.chatRepo.save(chat);
  }

  private async checkPermission(familyId: number, user: JwtUser) {
    const family = await this.familyService.getFamilyById(familyId);

    const isOwner = family.owner_id === user.id;
    const isMember = family.members?.some(member => member.user_id === user.id);
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isMember && !isAdmin) {
      throw new UnauthorizedException(ResponseMessageVi[ResponseCode.C00351]);
    }
  }
}
