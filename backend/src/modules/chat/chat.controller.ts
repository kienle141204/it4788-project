import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Lấy danh sách message của nhóm' })
  findByFamily(@Param('familyId', ParseIntPipe) familyId: number, @User() user: JwtUser) {
    return this.chatService.findByFamily(familyId, user);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Đánh dấu message đã đọc' })
  markAsRead(@Param('id', ParseIntPipe) id: number, @User() user: JwtUser) {
    return this.chatService.markAsRead(id, user);
  }
}
