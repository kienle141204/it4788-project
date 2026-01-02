import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseGateway, ConnectionManagerService, WsJwtGuard } from '../../common/websocket';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { FamilyService } from '../family/family.service';
import { MemberService } from '../member/member.service';
import { FirebaseService } from '../../firebase/firebase.service';
import { User } from '../../entities/user.entity';

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
        private readonly memberService: MemberService,
        private readonly firebaseService: FirebaseService,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
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
        // Enhanced authentication check with re-authentication if needed
        let user = client.data.user;

        // Log authentication state
        this.logger.debug(`[JOIN_ROOM] Socket ${client.id}, User data exists: ${!!user}, FamilyId: ${data.familyId}`);

        if (!user) {
            // Try to re-authenticate if user data is missing
            try {
                const context = {
                    switchToWs: () => ({
                        getClient: () => client,
                    }),
                    getClass: () => this.constructor,
                    getHandler: () => this.handleJoinRoom,
                } as any;

                await this.wsJwtGuard.canActivate(context);
                user = client.data.user;

                if (!user) {
                    this.logger.error(`[JOIN_ROOM] Re-authentication failed - user data still null for socket ${client.id}`);
                    return { success: false, error: 'Unauthorized - Authentication failed' };
                }

                this.logger.log(`[JOIN_ROOM] Re-authenticated user ${user.id} for socket ${client.id}`);
            } catch (error) {
                this.logger.error(`[JOIN_ROOM] Re-authentication error for socket ${client.id}: ${error.message}`);
                return { success: false, error: 'Unauthorized - Invalid token' };
            }
        }

        try {
            // Verify user is member of family
            this.logger.debug(`[JOIN_ROOM] Checking family membership for user ${user.id} in family ${data.familyId}`);

            const family = await this.familyService.getFamilyById(data.familyId);

            if (!family) {
                this.logger.warn(`[JOIN_ROOM] Family ${data.familyId} not found`);
                return { success: false, error: 'Nhóm không tồn tại' };
            }

            const isOwner = family.owner_id === user.id;
            const isMember = family.members?.some(member => member.user_id === user.id);

            this.logger.debug(`[JOIN_ROOM] User ${user.id} - Owner: ${isOwner}, Member: ${isMember}, Role: ${user.role}`);

            if (!isOwner && !isMember && user.role !== 'admin') {
                this.logger.warn(`[JOIN_ROOM] User ${user.id} has no access to family ${data.familyId}`);
                return { success: false, error: 'Không có quyền truy cập nhóm này' };
            }

            const roomName = `family_${data.familyId}`;
            client.join(roomName);

            this.logger.log(`[JOIN_ROOM] ✅ User ${user.id} (${user.email}) joined room ${roomName}`);

            // Notify others in room
            client.to(roomName).emit('user_joined', {
                userId: user.id,
                email: user.email,
            });

            return { success: true, room: roomName };
        } catch (error) {
            this.logger.error(`[JOIN_ROOM] Error for user ${user?.id} joining family ${data.familyId}: ${error.message}`, error.stack);
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

            // Gửi push notification đến các thành viên gia đình (trừ người gửi)
            try {
                const sender = await this.userRepository.findOne({ where: { id: user.id } });
                const senderName = sender?.full_name || user.email || `User ${user.id}`;
                const family = await this.familyService.getFamilyById(dto.familyId);
                const allMembers = await this.memberService.getMembersByFamily(dto.familyId);

                // Lấy danh sách user IDs cần gửi notification (trừ người gửi)
                const userIdsToNotify: number[] = [];

                for (const member of allMembers) {
                    if (member.user_id !== user.id) {
                        userIdsToNotify.push(member.user_id);
                    }
                }

                // Gửi cho owner nếu owner không phải là thành viên và không phải người gửi
                const isOwnerMember = allMembers.some(m => m.user_id === family.owner_id);
                if (!isOwnerMember && family.owner_id !== user.id) {
                    userIdsToNotify.push(family.owner_id);
                }

                // Gửi push notification qua Firebase
                if (userIdsToNotify.length > 0) {
                    // Format notification: Title = Tên nhóm, Body = Tên người nhắn\nNội dung tin nhắn
                    const notificationTitle = family.name || 'Nhóm';
                    const chatContent = chat.message || chat.title || 'Tin nhắn mới';
                    const notificationBody = `${senderName}\n${chatContent}`;

                    // Lấy avatar URL từ sender
                    const avatarUrl = sender?.avatar_url || null;

                    // Không cần set icon vì hệ thống tự động dùng app icon từ manifest
                    const pushData: Record<string, string> = {
                        type: 'chat_message',
                        chatId: chat.id.toString(),
                        familyId: dto.familyId.toString(),
                        senderId: user.id.toString(),
                    };

                    // Thêm avatar URL vào data để frontend có thể lấy được
                    if (avatarUrl) {
                        pushData.image = avatarUrl;
                    }

                    const pushResult = await this.firebaseService.sendToMultipleUsers(
                        userIdsToNotify,
                        notificationTitle,
                        notificationBody,
                        pushData,
                        avatarUrl ?? undefined, // image (avatar - large image trong notification)
                        undefined,      // icon - không cần vì hệ thống tự dùng app icon
                    );

                    this.logger.log(
                        `[ChatGateway] 📤 Firebase push sent: ${pushResult.success} success, ${pushResult.failed} failed`,
                    );
                }
            } catch (pushError) {
                // Log lỗi nhưng không ảnh hưởng đến việc gửi tin nhắn
                this.logger.error(`[ChatGateway] ⚠️ Firebase push error: ${pushError.message}`);
            }

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
