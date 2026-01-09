import {
    WebSocketGateway,
    SubscribeMessage,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UseGuards, Inject, forwardRef } from '@nestjs/common';
import { BaseGateway, ConnectionManagerService, WsJwtGuard } from '../../common/websocket';
import { ShoppingListService } from './shopping-list.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FamilyMember } from '../../entities/family-member.entity';

@WebSocketGateway({
    cors: {
        origin: '*',
        credentials: true,
    },
    namespace: '/shopping-list',
})
export class ShoppingListGateway extends BaseGateway {
    protected readonly namespace = '/shopping-list';

    constructor(
        connectionManager: ConnectionManagerService,
        wsJwtGuard: WsJwtGuard,
        @Inject(forwardRef(() => ShoppingListService))
        private readonly shoppingListService: ShoppingListService,
        @InjectRepository(FamilyMember)
        private readonly familyMemberRepo: Repository<FamilyMember>,
    ) {
        super(connectionManager, wsJwtGuard);
    }

    /**
     * Lấy danh sách userId của các thành viên trong family
     */
    private async getFamilyMemberIds(familyId: number): Promise<number[]> {
        const members = await this.familyMemberRepo.find({
            where: { family_id: familyId },
            select: ['user_id'],
        });
        return members.map(m => m.user_id);
    }

    /**
     * Emit thông báo khi shopping list được tạo mới
     */
    async emitShoppingListCreated(familyId: number, shoppingList: any, creatorId: number): Promise<void> {
        const memberIds = await this.getFamilyMemberIds(familyId);

        memberIds
            .filter(id => id !== creatorId) // Không gửi cho người tạo
            .forEach(userId => {
                this.emitToUser(userId, 'shopping_list_created', {
                    shoppingList,
                    message: 'Có danh sách mua sắm mới được tạo',
                });
            });

        this.logger.log(`Emitted shopping_list_created to family ${familyId}`);
    }

    /**
     * Emit thông báo khi shopping list được cập nhật
     */
    async emitShoppingListUpdated(familyId: number, shoppingList: any, updaterId: number): Promise<void> {
        const memberIds = await this.getFamilyMemberIds(familyId);

        memberIds
            .filter(id => id !== updaterId)
            .forEach(userId => {
                this.emitToUser(userId, 'shopping_list_updated', {
                    shoppingList,
                    message: 'Danh sách mua sắm đã được cập nhật',
                });
            });

        this.logger.log(`Emitted shopping_list_updated to family ${familyId}`);
    }

    /**
     * Emit thông báo khi shopping list được xóa
     */
    async emitShoppingListDeleted(familyId: number, listId: number, deleterId: number): Promise<void> {
        const memberIds = await this.getFamilyMemberIds(familyId);

        memberIds
            .filter(id => id !== deleterId)
            .forEach(userId => {
                this.emitToUser(userId, 'shopping_list_deleted', {
                    listId,
                    message: 'Danh sách mua sắm đã bị xóa',
                });
            });

        this.logger.log(`Emitted shopping_list_deleted to family ${familyId}`);
    }

    /**
     * Emit thông báo khi item được thêm vào shopping list
     */
    async emitItemAdded(familyId: number, listId: number, item: any, adderId: number): Promise<void> {
        const memberIds = await this.getFamilyMemberIds(familyId);

        memberIds
            .filter(id => id !== adderId)
            .forEach(userId => {
                this.emitToUser(userId, 'shopping_item_added', {
                    listId,
                    item,
                    message: 'Có mục mới được thêm vào danh sách',
                });
            });

        this.logger.log(`Emitted shopping_item_added to family ${familyId}`);
    }

    /**
     * Emit thông báo khi item được cập nhật (hoàn thành/chưa hoàn thành)
     */
    async emitItemUpdated(familyId: number, listId: number, item: any, updaterId: number): Promise<void> {
        const memberIds = await this.getFamilyMemberIds(familyId);

        memberIds
            .filter(id => id !== updaterId)
            .forEach(userId => {
                this.emitToUser(userId, 'shopping_item_updated', {
                    listId,
                    item,
                    message: 'Mục trong danh sách đã được cập nhật',
                });
            });

        this.logger.log(`Emitted shopping_item_updated to family ${familyId}`);
    }

    /**
     * Emit thông báo khi item bị xóa
     */
    async emitItemDeleted(familyId: number, listId: number, itemId: number, deleterId: number): Promise<void> {
        const memberIds = await this.getFamilyMemberIds(familyId);

        memberIds
            .filter(id => id !== deleterId)
            .forEach(userId => {
                this.emitToUser(userId, 'shopping_item_deleted', {
                    listId,
                    itemId,
                    message: 'Mục đã bị xóa khỏi danh sách',
                });
            });

        this.logger.log(`Emitted shopping_item_deleted to family ${familyId}`);
    }

    /**
     * Emit thông báo khi shopping list được chia sẻ
     */
    async emitShoppingListShared(familyId: number, shoppingList: any, sharerId: number): Promise<void> {
        const memberIds = await this.getFamilyMemberIds(familyId);

        memberIds
            .filter(id => id !== sharerId)
            .forEach(userId => {
                this.emitToUser(userId, 'shopping_list_shared', {
                    shoppingList,
                    message: 'Có danh sách mua sắm mới được chia sẻ',
                });
            });

        this.logger.log(`Emitted shopping_list_shared to family ${familyId}`);
    }

    /**
     * Client subscribe để nhận thông báo về shopping list
     */
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('subscribe')
    handleSubscribe(@ConnectedSocket() client: Socket) {
        const user = client.data.user;
        this.logger.log(`User ${user.id} subscribed to shopping list updates`);
        return { success: true, message: 'Subscribed to shopping list updates' };
    }

    /**
     * Client tham gia room của family để nhận updates
     */
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('join_family')
    handleJoinFamily(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { familyId: number },
    ) {
        const user = client.data.user;
        const room = `shopping_family_${data.familyId}`;
        client.join(room);
        this.logger.log(`User ${user.id} joined shopping room: ${room}`);
        return { success: true, message: `Joined shopping room for family ${data.familyId}` };
    }

    /**
     * Client rời khỏi room của family
     */
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('leave_family')
    handleLeaveFamily(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { familyId: number },
    ) {
        const user = client.data.user;
        const room = `shopping_family_${data.familyId}`;
        client.leave(room);
        this.logger.log(`User ${user.id} left shopping room: ${room}`);
        return { success: true, message: `Left shopping room for family ${data.familyId}` };
    }
}
