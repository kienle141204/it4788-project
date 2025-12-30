import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { BaseGateway, ConnectionManagerService, WsJwtGuard } from '../../common/websocket';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { FamilyService } from '../family/family.service';

@WebSocketGateway({
    namespace: '/chat',
    cors: {
        origin: '*',
        credentials: true,
    },
})
export class ChatGateway extends BaseGateway {
    protected readonly namespace = '/chat';

    constructor(
        connectionManager: ConnectionManagerService,
        wsJwtGuard: WsJwtGuard,
        private readonly chatService: ChatService,
        private readonly familyService: FamilyService,
    ) {
        super(connectionManager, wsJwtGuard);
    }

    /**
     * Join family chat room
     */
    @SubscribeMessage('join_room')
    async handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { familyId: number },
    ) {
        const user = client.data.user;
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        try {
            // Verify user is member of family
            const family = await this.familyService.getFamilyById(data.familyId);
            const isOwner = family.owner_id === user.id;
            const isMember = family.members?.some(member => member.id === user.id);

            if (!isOwner && !isMember && user.role !== 'admin') {
                return { success: false, error: 'Không có quyền truy cập nhóm này' };
            }

            const roomName = `family_${data.familyId}`;
            client.join(roomName);

            this.logger.log(`User ${user.id} joined room ${roomName}`);

            // Notify others in room
            client.to(roomName).emit('user_joined', {
                userId: user.id,
                email: user.email,
            });

            return { success: true, room: roomName };
        } catch (error) {
            this.logger.error(`Error joining room: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Leave family chat room
     */
    @SubscribeMessage('leave_room')
    handleLeaveRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { familyId: number },
    ) {
        const user = client.data.user;
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        const roomName = `family_${data.familyId}`;
        client.leave(roomName);

        this.logger.log(`User ${user.id} left room ${roomName}`);

        // Notify others in room
        client.to(roomName).emit('user_left', {
            userId: user.id,
            email: user.email,
        });

        return { success: true };
    }

    /**
     * Send message to family chat
     */
    @SubscribeMessage('send_message')
    async handleSendMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() dto: CreateChatDto,
    ) {
        const user = client.data.user;
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        try {
            // Save message to database
            const chat = await this.chatService.create(user, dto);

            const roomName = `family_${dto.familyId}`;

            // Broadcast to all in room (including sender)
            this.server.to(roomName).emit('new_message', {
                id: chat.id,
                userId: chat.userId,
                title: chat.title,
                message: chat.message,
                data: chat.data,
                familyId: chat.familyId,
                createdAt: chat.createdAt,
                senderEmail: user.email,
            });

            this.logger.log(`Message sent to room ${roomName} by user ${user.id}`);

            return { success: true, messageId: chat.id };
        } catch (error) {
            this.logger.error(`Error sending message: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Typing indicator
     */
    @SubscribeMessage('typing')
    handleTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { familyId: number; isTyping: boolean },
    ) {
        const user = client.data.user;
        if (!user) return;

        const roomName = `family_${data.familyId}`;

        client.to(roomName).emit('user_typing', {
            userId: user.id,
            email: user.email,
            isTyping: data.isTyping,
        });
    }

    /**
     * Mark message as read
     */
    @SubscribeMessage('mark_read')
    async handleMarkRead(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { messageId: number; familyId: number },
    ) {
        const user = client.data.user;
        if (!user) {
            return { success: false, error: 'Unauthorized' };
        }

        try {
            await this.chatService.markAsRead(data.messageId, user);

            const roomName = `family_${data.familyId}`;

            // Notify others that message was read
            client.to(roomName).emit('message_read', {
                messageId: data.messageId,
                readBy: user.id,
            });

            return { success: true };
        } catch (error) {
            this.logger.error(`Error marking message as read: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Override để handle user connected
     */
    protected async onUserConnected(client: Socket, user: any): Promise<void> {
        this.logger.log(`User ${user.id} (${user.email}) connected to chat`);
    }

    /**
     * Override để handle user disconnected
     */
    protected async onUserDisconnected(client: Socket, userId: number): Promise<void> {
        this.logger.log(`User ${userId} disconnected from chat`);
    }
}
