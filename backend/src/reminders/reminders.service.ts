import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository, LessThan, MoreThan, In } from 'typeorm';
import { FirebaseService } from "../firebase/firebase.service";
import { FridgeDish } from '../entities/fridge-dish.entity';
import { FridgeIngredient } from '../entities/fridge-ingredient.entity';
import { Family } from 'src/entities/family.entity';
import { FamilyMember } from 'src/entities/family-member.entity';
import { DeviceToken } from 'src/entities/device-token.entity';
import { Refrigerator } from 'src/entities/refrigerator.entity';
import { NotificationsService } from '../modules/notifications/notifications.service';

@Injectable()
export class RemindersService {
    private readonly logger = new Logger(RemindersService.name);

    constructor(
        private firebaseService: FirebaseService,
        @Inject(forwardRef(() => NotificationsService))
        private readonly notificationsService: NotificationsService,
        @InjectRepository(DeviceToken)
        private readonly deviceRepo: Repository<DeviceToken>,

        @InjectRepository(FridgeDish)
        private readonly dishRepo: Repository<FridgeDish>,

        @InjectRepository(FridgeIngredient)
        private readonly ingredientRepo: Repository<FridgeIngredient>,

        @InjectRepository(Family)
        private readonly familyRepo: Repository<Family>,

        @InjectRepository(FamilyMember)
        private readonly memberRepo: Repository<FamilyMember>,

        @InjectRepository(Refrigerator)
        private readonly refrigeratorRepo: Repository<Refrigerator>,
    ) { }

    /**
     * Gửi thông báo cho chủ sở hữu tủ lạnh (cá nhân hoặc gia đình)
     */
    private async sendNotificationToFridgeOwner(
        refrigerator: Refrigerator,
        title: string,
        message: string,
    ): Promise<void> {
        // Nếu là tủ lạnh gia đình, gửi cho tất cả thành viên
        if (refrigerator.family_id) {
            const members = await this.memberRepo.find({
                where: { family_id: refrigerator.family_id },
            });

            for (const member of members) {
                // Tạo notification record trong database
                try {
                    await this.notificationsService.createNotification(
                        member.user_id,
                        title,
                        message,
                    );
                } catch (error) {
                    this.logger.error(`Error creating notification for user ${member.user_id}:`, error);
                }

                // Gửi push notification
                const device = await this.deviceRepo.findOne({
                    where: { userId: member.user_id },
                });

                if (device) {
                    try {
                        await this.firebaseService.sendNotification(
                            device.deviceToken,
                            title,
                            message,
                        );
                    } catch (error) {
                        this.logger.error(`Error sending push notification to user ${member.user_id}:`, error);
                    }
                }
            }
        } else {
            // Tủ lạnh cá nhân, gửi cho chủ sở hữu
            // Tạo notification record trong database
            try {
                await this.notificationsService.createNotification(
                    refrigerator.owner_id,
                    title,
                    message,
                );
            } catch (error) {
                this.logger.error(`Error creating notification for user ${refrigerator.owner_id}:`, error);
            }

            // Gửi push notification
            const device = await this.deviceRepo.findOne({
                where: { userId: refrigerator.owner_id },
            });

            if (device) {
                try {
                    await this.firebaseService.sendNotification(
                        device.deviceToken,
                        title,
                        message,
                    );
                } catch (error) {
                    this.logger.error(`Error sending push notification to user ${refrigerator.owner_id}:`, error);
                }
            }
        }
    }

    /**
     * Kiểm tra và gửi thông báo cho món ăn sắp hết hạn (≤ 3 ngày)
     */
    private async checkExpiringDishes(now: Date, scheduleDate: Date): Promise<number> {
        const expiringDishes = await this.dishRepo.find({
            where: { 
                expiration_date: LessThanOrEqual(scheduleDate),
                stock: MoreThan(0), // Chỉ kiểm tra khi stock > 0
            },
            relations: ['dish', 'refrigerator'],
        });

        let notificationCount = 0;

        for (const item of expiringDishes) {
            if (!item.expiration_date) continue;

            // Convert expiration_date to Date object if it's a string
            const expiryDate = item.expiration_date instanceof Date 
                ? item.expiration_date 
                : new Date(item.expiration_date);

            const daysUntilExpiry = Math.ceil(
                (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            );

            // Chỉ gửi thông báo cho sản phẩm sắp hết hạn (≤ 3 ngày) hoặc đã hết hạn
            if (daysUntilExpiry > 3) continue;

            const message = daysUntilExpiry < 0
                ? `🚨 Món ăn "${item.dish?.name}" đã hết hạn ${Math.abs(daysUntilExpiry)} ngày (hết hạn: ${expiryDate.toISOString().slice(0, 10)}).`
                : `⚠️ Món ăn "${item.dish?.name}" sẽ hết hạn trong ${daysUntilExpiry} ngày (hết hạn: ${expiryDate.toISOString().slice(0, 10)}).`;

            this.logger.warn(message);

            await this.sendNotificationToFridgeOwner(
                item.refrigerator,
                "Thông báo hạn món ăn",
                message,
            );
            notificationCount++;
        }

        return notificationCount;
    }

    /**
     * Kiểm tra và gửi thông báo cho nguyên liệu sắp hết hạn (≤ 3 ngày)
     */
    private async checkExpiringIngredients(now: Date, scheduleDate: Date): Promise<number> {
        const expiringIngredients = await this.ingredientRepo.find({
            where: { 
                expiration_date: LessThanOrEqual(scheduleDate),
                stock: MoreThan(0), // Chỉ kiểm tra khi stock > 0
            },
            relations: ['ingredient', 'refrigerator'],
        });

        let notificationCount = 0;

        for (const item of expiringIngredients) {
            if (!item.expiration_date) continue;

            // Convert expiration_date to Date object if it's a string
            const expiryDate = item.expiration_date instanceof Date 
                ? item.expiration_date 
                : new Date(item.expiration_date);

            const daysUntilExpiry = Math.ceil(
                (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            );

            // Chỉ gửi thông báo cho sản phẩm sắp hết hạn (≤ 3 ngày) hoặc đã hết hạn
            if (daysUntilExpiry > 3) continue;

            const message = daysUntilExpiry < 0
                ? `🚨 Nguyên liệu "${item.ingredient?.name}" đã hết hạn ${Math.abs(daysUntilExpiry)} ngày (hết hạn: ${expiryDate.toISOString().slice(0, 10)}).`
                : `⚠️ Nguyên liệu "${item.ingredient?.name}" sẽ hết hạn trong ${daysUntilExpiry} ngày (hết hạn: ${expiryDate.toISOString().slice(0, 10)}).`;

            this.logger.warn(message);

            await this.sendNotificationToFridgeOwner(
                item.refrigerator,
                "Thông báo hạn thực phẩm",
                message,
            );
            notificationCount++;
        }

        return notificationCount;
    }

    /**
     * Kiểm tra và gửi thông báo cho sản phẩm đã hết hạn
     */
    private async checkExpiredItems(now: Date): Promise<number> {
        // Lấy món ăn đã hết hạn
        const expiredDishes = await this.dishRepo.find({
            where: { 
                expiration_date: LessThan(now),
                stock: MoreThan(0), // Chỉ kiểm tra khi stock > 0
            },
            relations: ['dish', 'refrigerator'],
        });

        // Lấy nguyên liệu đã hết hạn
        const expiredIngredients = await this.ingredientRepo.find({
            where: { 
                expiration_date: LessThan(now),
                stock: MoreThan(0), // Chỉ kiểm tra khi stock > 0
            },
            relations: ['ingredient', 'refrigerator'],
        });

        let notificationCount = 0;

        // Gửi thông báo cho món ăn đã hết hạn
        for (const item of expiredDishes) {
            if (!item.expiration_date) continue;

            // Convert expiration_date to Date object if it's a string
            const expiryDate = item.expiration_date instanceof Date 
                ? item.expiration_date 
                : new Date(item.expiration_date);

            const daysExpired = Math.ceil(
                (now.getTime() - expiryDate.getTime()) / (1000 * 60 * 60 * 24),
            );

            const message = `🚨 Món ăn "${item.dish?.name}" đã hết hạn ${daysExpired} ngày (hết hạn: ${expiryDate.toISOString().slice(0, 10)}).`;

            this.logger.warn(message);

            await this.sendNotificationToFridgeOwner(
                item.refrigerator,
                "Thông báo món ăn đã hết hạn",
                message,
            );
            notificationCount++;
        }

        // Gửi thông báo cho nguyên liệu đã hết hạn
        for (const item of expiredIngredients) {
            if (!item.expiration_date) continue;

            // Convert expiration_date to Date object if it's a string
            const expiryDate = item.expiration_date instanceof Date 
                ? item.expiration_date 
                : new Date(item.expiration_date);

            const daysExpired = Math.ceil(
                (now.getTime() - expiryDate.getTime()) / (1000 * 60 * 60 * 24),
            );

            const message = `🚨 Nguyên liệu "${item.ingredient?.name}" đã hết hạn ${daysExpired} ngày (hết hạn: ${expiryDate.toISOString().slice(0, 10)}).`;

            this.logger.warn(message);

            await this.sendNotificationToFridgeOwner(
                item.refrigerator,
                "Thông báo nguyên liệu đã hết hạn",
                message,
            );
            notificationCount++;
        }

        return notificationCount;
    }

    /* Cron job chạy mỗi ngày lúc 11:32 sáng - kiểm tra sản phẩm sắp hết hạn (≤ 3 ngày) */
    @Cron('0 36 11 * * *')
    async checkExpiringItems() {
        this.logger.debug('🔍 CronJob: Bắt đầu kiểm tra món ăn & nguyên liệu sắp hết hạn...');

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        // Cả món ăn và nguyên liệu đều cảnh báo 3 ngày trước
        const scheduleDate = new Date(now);
        scheduleDate.setDate(now.getDate() + 3);

        // Kiểm tra sản phẩm sắp hết hạn (≤ 3 ngày)
        const expiringDishCount = await this.checkExpiringDishes(now, scheduleDate);
        const expiringIngredientCount = await this.checkExpiringIngredients(now, scheduleDate);

        this.logger.debug(
            `✔️ Xong: ${expiringDishCount} món ăn sắp hết hạn + ${expiringIngredientCount} nguyên liệu sắp hết hạn.`,
        );
    }

    /* Cron job chạy mỗi ngày lúc 11:32 sáng - kiểm tra sản phẩm đã hết hạn */
    @Cron('0 36 11 * * *')
    async checkAlreadyExpiredItems() {
        this.logger.debug('🔍 CronJob: Bắt đầu kiểm tra món ăn & nguyên liệu đã hết hạn...');

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        // Kiểm tra sản phẩm đã hết hạn
        const expiredCount = await this.checkExpiredItems(now);

        this.logger.debug(
            `✔️ Xong: ${expiredCount} sản phẩm đã hết hạn.`,
        );
    }
}
