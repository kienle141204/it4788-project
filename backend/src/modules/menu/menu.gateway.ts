import {
    WebSocketGateway,
    SubscribeMessage,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UseGuards, Inject, forwardRef } from '@nestjs/common';
import { BaseGateway, ConnectionManagerService, WsJwtGuard } from '../../common/websocket';
import { MenuService } from './menu.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FamilyMember } from '../../entities/family-member.entity';

@WebSocketGateway({
    cors: {
        origin: '*',
        credentials: true,
    },
    namespace: '/menu',
})
export class MenuGateway extends BaseGateway {
    protected readonly namespace = '/menu';

    constructor(
        connectionManager: ConnectionManagerService,
        wsJwtGuard: WsJwtGuard,
        @Inject(forwardRef(() => MenuService))
        private readonly menuService: MenuService,
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
     * Emit khi menu được tạo mới
     */
    async emitMenuCreated(familyId: number, menu: any, creatorId: number): Promise<void> {
        const memberIds = await this.getFamilyMemberIds(familyId);

        memberIds
            .filter(id => id !== creatorId)
            .forEach(userId => {
                this.emitToUser(userId, 'menu_created', {
                    menu,
                    message: 'Có thực đơn mới được tạo',
                });
            });

        this.logger.log(`Emitted menu_created to family ${familyId}`);
    }

    /**
     * Emit khi menu được cập nhật
     */
    async emitMenuUpdated(familyId: number, menu: any, updaterId: number): Promise<void> {
        const memberIds = await this.getFamilyMemberIds(familyId);

        memberIds
            .filter(id => id !== updaterId)
            .forEach(userId => {
                this.emitToUser(userId, 'menu_updated', {
                    menu,
                    message: 'Thực đơn đã được cập nhật',
                });
            });

        this.logger.log(`Emitted menu_updated to family ${familyId}`);
    }

    /**
     * Emit khi menu bị xóa
     */
    async emitMenuDeleted(familyId: number, menuId: number, deleterId: number): Promise<void> {
        const memberIds = await this.getFamilyMemberIds(familyId);

        memberIds
            .filter(id => id !== deleterId)
            .forEach(userId => {
                this.emitToUser(userId, 'menu_deleted', {
                    menuId,
                    message: 'Thực đơn đã bị xóa',
                });
            });

        this.logger.log(`Emitted menu_deleted to family ${familyId}`);
    }

    /**
     * Emit khi món ăn được thêm vào menu
     */
    async emitDishAddedToMenu(familyId: number, menuId: number, menuDish: any, adderId: number): Promise<void> {
        const memberIds = await this.getFamilyMemberIds(familyId);

        memberIds
            .filter(id => id !== adderId)
            .forEach(userId => {
                this.emitToUser(userId, 'menu_dish_added', {
                    menuId,
                    menuDish,
                    message: 'Có món ăn mới được thêm vào thực đơn',
                });
            });

        this.logger.log(`Emitted menu_dish_added to family ${familyId}`);
    }

    /**
     * Emit khi món ăn trong menu được cập nhật
     */
    async emitMenuDishUpdated(familyId: number, menuId: number, menuDish: any, updaterId: number): Promise<void> {
        const memberIds = await this.getFamilyMemberIds(familyId);

        memberIds
            .filter(id => id !== updaterId)
            .forEach(userId => {
                this.emitToUser(userId, 'menu_dish_updated', {
                    menuId,
                    menuDish,
                    message: 'Món ăn trong thực đơn đã được cập nhật',
                });
            });

        this.logger.log(`Emitted menu_dish_updated to family ${familyId}`);
    }

    /**
     * Emit khi món ăn bị xóa khỏi menu
     */
    async emitDishRemovedFromMenu(familyId: number, menuId: number, menuDishId: number, removerId: number): Promise<void> {
        const memberIds = await this.getFamilyMemberIds(familyId);

        memberIds
            .filter(id => id !== removerId)
            .forEach(userId => {
                this.emitToUser(userId, 'menu_dish_removed', {
                    menuId,
                    menuDishId,
                    message: 'Món ăn đã bị xóa khỏi thực đơn',
                });
            });

        this.logger.log(`Emitted menu_dish_removed to family ${familyId}`);
    }

    /**
     * Emit nhắc nhở thực đơn (ví dụ: đến giờ nấu ăn)
     */
    async emitMenuReminder(familyId: number, menu: any): Promise<void> {
        const memberIds = await this.getFamilyMemberIds(familyId);

        memberIds.forEach(userId => {
            this.emitToUser(userId, 'menu_reminder', {
                menu,
                message: 'Nhắc nhở: Đã đến giờ chuẩn bị bữa ăn',
            });
        });

        this.logger.log(`Emitted menu_reminder to family ${familyId}`);
    }

    /**
     * Client subscribe để nhận thông báo về menu
     */
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('subscribe')
    handleSubscribe(@ConnectedSocket() client: Socket) {
        const user = client.data.user;
        this.logger.log(`User ${user.id} subscribed to menu updates`);
        return { success: true, message: 'Subscribed to menu updates' };
    }

    /**
     * Client tham gia room của family để nhận updates về menu
     */
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('join_family')
    handleJoinFamily(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { familyId: number },
    ) {
        const user = client.data.user;
        const room = `menu_family_${data.familyId}`;
        client.join(room);
        this.logger.log(`User ${user.id} joined menu room: ${room}`);
        return { success: true, message: `Joined menu room for family ${data.familyId}` };
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
        const room = `menu_family_${data.familyId}`;
        client.leave(room);
        this.logger.log(`User ${user.id} left menu room: ${room}`);
        return { success: true, message: `Left menu room for family ${data.familyId}` };
    }
}
