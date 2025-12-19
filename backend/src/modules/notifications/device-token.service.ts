import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceToken } from '../../entities/device-token.entity';

@Injectable()
export class DeviceTokenService {
    constructor(
        @InjectRepository(DeviceToken)
        private deviceTokenRepository: Repository<DeviceToken>,
    ) {}

    /**
     * Đăng ký hoặc cập nhật device token cho user
     * Nếu token đã tồn tại cho user và platform, sẽ cập nhật
     * Nếu chưa tồn tại, sẽ tạo mới
     */
    async registerToken(
        userId: number,
        deviceToken: string,
        platform: 'ios' | 'android',
    ): Promise<DeviceToken> {
        // Kiểm tra xem token đã tồn tại cho user này chưa
        const existingToken = await this.deviceTokenRepository.findOne({
            where: {
                userId,
                deviceToken,
            },
        });

        if (existingToken) {
            // Cập nhật platform nếu khác
            if (existingToken.platform !== platform) {
                existingToken.platform = platform;
                return await this.deviceTokenRepository.save(existingToken);
            }
            return existingToken;
        }

        // Tạo token mới
        const newToken = this.deviceTokenRepository.create({
            userId,
            deviceToken,
            platform,
        });

        return await this.deviceTokenRepository.save(newToken);
    }

    /**
     * Xóa device token của user
     */
    async removeToken(userId: number, deviceToken: string): Promise<void> {
        await this.deviceTokenRepository.delete({
            userId,
            deviceToken,
        });
    }

    /**
     * Lấy tất cả device tokens của user
     */
    async getUserTokens(userId: number): Promise<DeviceToken[]> {
        return await this.deviceTokenRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Xóa token không hợp lệ (được gọi từ FirebaseService khi phát hiện invalid token)
     */
    async removeInvalidToken(token: string): Promise<void> {
        const result = await this.deviceTokenRepository.delete({
            deviceToken: token,
        });

        if (result.affected && result.affected > 0) {
            console.log(`✅ Removed invalid token from database (${result.affected} record(s))`);
        }
    }

    /**
     * Xóa tất cả tokens của user (khi user logout hoặc xóa account)
     */
    async removeAllUserTokens(userId: number): Promise<number> {
        const result = await this.deviceTokenRepository.delete({
            userId,
        });
        return result.affected || 0;
    }
}

