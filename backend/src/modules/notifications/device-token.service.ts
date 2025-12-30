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
        console.log(`[DeviceTokenService] 📝 Registering token for user ${userId}, platform: ${platform}`);
        console.log(`[DeviceTokenService] 🔑 Token: ${deviceToken.substring(0, 20)}...`);
        
        // Kiểm tra xem token đã tồn tại cho user này chưa
        const existingToken = await this.deviceTokenRepository.findOne({
            where: {
                userId,
                deviceToken,
            },
        });

        if (existingToken) {
            console.log(`[DeviceTokenService] ✅ Token already exists for user ${userId}`);
            // Cập nhật platform nếu khác
            if (existingToken.platform !== platform) {
                console.log(`[DeviceTokenService] 🔄 Updating platform from ${existingToken.platform} to ${platform}`);
                existingToken.platform = platform;
                return await this.deviceTokenRepository.save(existingToken);
            }
            return existingToken;
        }

        // Tạo token mới
        console.log(`[DeviceTokenService] ➕ Creating new token for user ${userId}`);
        const newToken = this.deviceTokenRepository.create({
            userId,
            deviceToken,
            platform,
        });

        const savedToken = await this.deviceTokenRepository.save(newToken);
        console.log(`[DeviceTokenService] ✅ Token registered successfully with ID: ${savedToken.id}`);
        return savedToken;
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
        const tokens = await this.deviceTokenRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
        console.log(`[DeviceTokenService] 🔍 Querying tokens for user ${userId}: found ${tokens.length} token(s)`);
        if (tokens.length > 0) {
            tokens.forEach((token, index) => {
                console.log(`[DeviceTokenService]   Token ${index + 1}: ${token.deviceToken.substring(0, 20)}... (${token.platform}, created: ${token.createdAt})`);
            });
        } else {
            console.warn(`[DeviceTokenService] ⚠️ User ${userId} has no registered device tokens. Possible reasons:
  - User hasn't logged in on any device
  - User hasn't granted notification permissions
  - Token registration failed on client side
  - Tokens were removed/unregistered`);
        }
        return tokens;
    }

    /**
     * Xóa token không hợp lệ (được gọi từ FirebaseService khi phát hiện invalid token)
     */
    async removeInvalidToken(token: string): Promise<void> {
        const result = await this.deviceTokenRepository.delete({
            deviceToken: token,
        });
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

