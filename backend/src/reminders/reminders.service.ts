import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { FirebaseService } from "../firebase/firebase.service";
import { FridgeDish } from '../entities/fridge-dish.entity';
import { FridgeIngredient } from '../entities/fridge-ingredient.entity';
import { Family } from 'src/entities/family.entity';
import { FamilyMember } from 'src/entities/family-member.entity';
import { DeviceToken } from 'src/entities/device-token.entity';

@Injectable()
export class RemindersService {
    private readonly logger = new Logger(RemindersService.name);

    constructor(
        private firebaseService: FirebaseService,
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
    ) { }

    /** Cron job chạy mỗi ngày lúc 8:00 sáng */
    @Cron('0 0 8 * * *')
    async checkExpiringItems() {
        this.logger.debug('🔍 CronJob: Bắt đầu kiểm tra món ăn & nguyên liệu hết hạn...');

        const now = new Date();
        const dishSchedule = new Date(now);
        dishSchedule.setDate(now.getDate() - 1); // món ăn lưu > 1 ngày

        const ingredientSchedule = new Date(now);
        ingredientSchedule.setDate(now.getDate() - 3); // nguyên liệu lưu > 3 ngày

        /** 1. LẤY MÓN ĂN SẮP HẾT (FridgeDish) **/
        const expiringDishes = await this.dishRepo.find({
            where: { created_at: LessThanOrEqual(dishSchedule) },
            relations: ['dish', 'refrigerator'],
        });

        for (const item of expiringDishes) {

            const daysStored = Math.ceil(
                (now.getTime() - item.created_at.getTime()) / (1000 * 60 * 60 * 24),
            );

            const message =
                `⚠️ Món ăn "${item.dish?.name}" đã lưu trong tủ ${daysStored} ngày (tạo lúc: ${item.created_at.toISOString().slice(0, 10)}).`;

            this.logger.warn(message);

            const members = await this.memberRepo.find({
                where: { family_id: item.refrigerator.family_id },
            });

            for (const m of members) {
                const device = await this.deviceRepo.findOne({
                    where: { userId: m.user_id },
                });

                if (!device) continue;

                await this.firebaseService.sendNotification(
                    device.deviceToken,
                    "Thông báo hạn món ăn",
                    message,
                );
            }
        }

        /** 2. NGUYÊN LIỆU SẮP HẾT (FridgeIngredient) **/
        const expiringIngredients = await this.ingredientRepo.find({
            where: { created_at: LessThanOrEqual(ingredientSchedule) },
            relations: ['ingredient', 'refrigerator'],
        });

        for (const item of expiringIngredients) {

            const daysStored = Math.ceil(
                (now.getTime() - item.created_at.getTime()) / (1000 * 60 * 60 * 24),
            );

            const message =
                `⚠️ Nguyên liệu "${item.ingredient?.name}" đã lưu ${daysStored} ngày (tạo lúc: ${item.created_at.toISOString().slice(0, 10)}).`;

            this.logger.warn(message);

            const members = await this.memberRepo.find({
                where: { family_id: item.refrigerator.family_id },
            });

            for (const m of members) {
                const device = await this.deviceRepo.findOne({
                    where: { userId: m.user_id },
                });

                if (!device) continue;

                await this.firebaseService.sendNotification(
                    device.deviceToken,
                    "Thông báo hạn thực phẩm",
                    message,
                );
            }
        }

        this.logger.debug(
            `✔️ Xong: ${expiringDishes.length} món ăn + ${expiringIngredients.length} nguyên liệu.`,
        );
    }
}
