import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from '../../entities/chat.entity';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { FamilyModule } from '../family/family.module';
import { WebSocketModule } from '../../common/websocket';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat]),
    FamilyModule,
    WebSocketModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule { }
