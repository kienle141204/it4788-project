import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { JwtAuthGuard, User } from 'src/common';
import type { JwtUser } from 'src/common/types/user.type';

@ApiTags('Chat')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) { }

  @Post()
  @ApiOperation({ summary: 'Gửi message vào nhóm' })
  create(@Body() dto: CreateChatDto, @User() user: JwtUser) {
    return this.chatService.create(user, dto);
  }

  @Get('family/:familyId')
  @ApiOperation({ summary: 'Lấy danh sách message của nhóm (có pagination)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số lượng tin nhắn (mặc định 30)' })
  @ApiQuery({ name: 'lastId', required: false, type: Number, description: 'ID tin nhắn cuối cùng để load tiếp' })
  findByFamily(
    @Param('familyId', ParseIntPipe) familyId: number,
    @Query('limit') limit: string,
    @Query('lastId') lastId: string,
    @User() user: JwtUser,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 30;
    const lastIdNum = lastId ? parseInt(lastId, 10) : undefined;
    return this.chatService.findByFamily(familyId, user, limitNum, lastIdNum);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Đánh dấu message đã đọc' })
  markAsRead(@Param('id', ParseIntPipe) id: number, @User() user: JwtUser) {
    return this.chatService.markAsRead(id, user);
  }
}
