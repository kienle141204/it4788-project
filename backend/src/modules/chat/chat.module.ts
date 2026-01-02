import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from '../../entities/chat.entity';
import { User } from '../../entities/user.entity';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { FamilyModule } from '../family/family.module';
import { MemberModule } from '../member/member.module';
import { WebSocketModule } from '../../common/websocket';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat, User]),
    FamilyModule,
    MemberModule,
    WebSocketModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule { }

