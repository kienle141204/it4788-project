import {
    WebSocketGateway,
    SubscribeMessage,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { UseGuards, Inject, forwardRef } from '@nestjs/common';
import { BaseGateway, ConnectionManagerService, WsJwtGuard } from '../../common/websocket';
import { RefrigeratorService } from './refrigerator.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FamilyMember } from '../../entities/family-member.entity';
import { Refrigerator } from '../../entities/refrigerator.entity';

@WebSocketGateway({
    cors: {
        origin: '*',
        credentials: true,
    },
    namespace: '/refrigerator',
})
export class RefrigeratorGateway extends BaseGateway {
    protected readonly namespace = '/refrigerator';

    constructor(
        connectionManager: ConnectionManagerService,
        wsJwtGuard: WsJwtGuard,
        @Inject(forwardRef(() => RefrigeratorService))
        private readonly refrigeratorService: RefrigeratorService,
        @InjectRepository(FamilyMember)
        private readonly familyMemberRepo: Repository<FamilyMember>,
        @InjectRepository(Refrigerator)
        private readonly refrigeratorRepo: Repository<Refrigerator>,
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
     * Lấy family_id từ refrigerator_id
     */
    private async getFamilyIdFromRefrigerator(refrigeratorId: number): Promise<number | null> {
        const refrigerator = await this.refrigeratorRepo.findOne({
            where: { id: refrigeratorId },
            select: ['family_id'],
        });
        return refrigerator?.family_id || null;
    }

    /**
     * Emit khi nguyên liệu được thêm vào tủ lạnh
     */
    async emitIngredientAdded(refrigeratorId: number, ingredient: any, adderId: number): Promise<void> {
        const familyId = await this.getFamilyIdFromRefrigerator(refrigeratorId);
        if (!familyId) return;

        const memberIds = await this.getFamilyMemberIds(familyId);

        memberIds
            .filter(id => id !== adderId)
            .forEach(userId => {
                this.emitToUser(userId, 'fridge_ingredient_added', {
                    refrigeratorId,
                    ingredient,
                    message: 'Có nguyên liệu mới được thêm vào tủ lạnh',
                });
            });

        this.logger.log(`Emitted fridge_ingredient_added to family ${familyId}`);
    }

    /**
     * Emit khi nguyên liệu được cập nhật
     */
    async emitIngredientUpdated(refrigeratorId: number, ingredient: any, updaterId: number): Promise<void> {
        const familyId = await this.getFamilyIdFromRefrigerator(refrigeratorId);
        if (!familyId) return;

        const memberIds = await this.getFamilyMemberIds(familyId);

        memberIds
            .filter(id => id !== updaterId)
            .forEach(userId => {
                this.emitToUser(userId, 'fridge_ingredient_updated', {
                    refrigeratorId,
                    ingredient,
                    message: 'Nguyên liệu trong tủ lạnh đã được cập nhật',
                });
            });

        this.logger.log(`Emitted fridge_ingredient_updated to family ${familyId}`);
    }

    /**
     * Emit khi nguyên liệu bị xóa
     */
    async emitIngredientDeleted(refrigeratorId: number, ingredientId: number, deleterId: number): Promise<void> {
        const familyId = await this.getFamilyIdFromRefrigerator(refrigeratorId);
        if (!familyId) return;

        const memberIds = await this.getFamilyMemberIds(familyId);

        memberIds
            .filter(id => id !== deleterId)
            .forEach(userId => {
                this.emitToUser(userId, 'fridge_ingredient_deleted', {
                    refrigeratorId,
                    ingredientId,
                    message: 'Nguyên liệu đã bị xóa khỏi tủ lạnh',
                });
            });

        this.logger.log(`Emitted fridge_ingredient_deleted to family ${familyId}`);
    }

    /**
     * Emit khi món ăn được thêm vào tủ lạnh
     */
    async emitDishAdded(refrigeratorId: number, dish: any, adderId: number): Promise<void> {
        const familyId = await this.getFamilyIdFromRefrigerator(refrigeratorId);
        if (!familyId) return;

        const memberIds = await this.getFamilyMemberIds(familyId);

        memberIds
            .filter(id => id !== adderId)
            .forEach(userId => {
                this.emitToUser(userId, 'fridge_dish_added', {
                    refrigeratorId,
                    dish,
                    message: 'Có món ăn mới được thêm vào tủ lạnh',
                });
            });

        this.logger.log(`Emitted fridge_dish_added to family ${familyId}`);
    }

    /**
     * Emit khi món ăn được cập nhật
     */
    async emitDishUpdated(refrigeratorId: number, dish: any, updaterId: number): Promise<void> {
        const familyId = await this.getFamilyIdFromRefrigerator(refrigeratorId);
        if (!familyId) return;

        const memberIds = await this.getFamilyMemberIds(familyId);

        memberIds
            .filter(id => id !== updaterId)
            .forEach(userId => {
                this.emitToUser(userId, 'fridge_dish_updated', {
                    refrigeratorId,
                    dish,
                    message: 'Món ăn trong tủ lạnh đã được cập nhật',
                });
            });

        this.logger.log(`Emitted fridge_dish_updated to family ${familyId}`);
    }

    /**
     * Emit khi món ăn bị xóa
     */
    async emitDishDeleted(refrigeratorId: number, dishId: number, deleterId: number): Promise<void> {
        const familyId = await this.getFamilyIdFromRefrigerator(refrigeratorId);
        if (!familyId) return;

        const memberIds = await this.getFamilyMemberIds(familyId);

        memberIds
            .filter(id => id !== deleterId)
            .forEach(userId => {
                this.emitToUser(userId, 'fridge_dish_deleted', {
                    refrigeratorId,
                    dishId,
                    message: 'Món ăn đã bị xóa khỏi tủ lạnh',
                });
            });

        this.logger.log(`Emitted fridge_dish_deleted to family ${familyId}`);
    }

    /**
     * Emit cảnh báo hết hạn
     */
    async emitExpirationWarning(refrigeratorId: number, items: any[]): Promise<void> {
        const familyId = await this.getFamilyIdFromRefrigerator(refrigeratorId);
        if (!familyId) return;

        const memberIds = await this.getFamilyMemberIds(familyId);

        memberIds.forEach(userId => {
            this.emitToUser(userId, 'fridge_expiration_warning', {
                refrigeratorId,
                items,
                message: 'Có thực phẩm sắp hết hạn trong tủ lạnh',
            });
        });

        this.logger.log(`Emitted fridge_expiration_warning to family ${familyId}`);
    }

    /**
     * Client subscribe để nhận thông báo về tủ lạnh
     */
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('subscribe')
    handleSubscribe(@ConnectedSocket() client: Socket) {
        const user = client.data.user;
        this.logger.log(`User ${user.id} subscribed to refrigerator updates`);
        return { success: true, message: 'Subscribed to refrigerator updates' };
    }

    /**
     * Client tham gia room của family để nhận updates về tủ lạnh
     */
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('join_family')
    handleJoinFamily(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { familyId: number },
    ) {
        const user = client.data.user;
        const room = `fridge_family_${data.familyId}`;
        client.join(room);
        this.logger.log(`User ${user.id} joined refrigerator room: ${room}`);
        return { success: true, message: `Joined refrigerator room for family ${data.familyId}` };
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
        const room = `fridge_family_${data.familyId}`;
        client.leave(room);
        this.logger.log(`User ${user.id} left refrigerator room: ${room}`);
        return { success: true, message: `Left refrigerator room for family ${data.familyId}` };
    }
}
