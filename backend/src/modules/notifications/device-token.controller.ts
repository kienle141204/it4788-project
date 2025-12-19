import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiBody,
} from '@nestjs/swagger';
import { DeviceTokenService } from './device-token.service';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { User, JwtAuthGuard } from 'src/common';
import type { JwtUser } from '../../common/types/user.type';

@ApiTags('Notifications')
@Controller('api/notifications/device-token')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class DeviceTokenController {
    constructor(private readonly deviceTokenService: DeviceTokenService) {}

    /**
     * Đăng ký hoặc cập nhật device token
     * POST /api/notifications/device-token
     */
    @Post()
    @ApiOperation({
        summary: 'Đăng ký/cập nhật device token',
        description:
            'API này cho phép đăng ký hoặc cập nhật FCM device token cho thiết bị của người dùng hiện tại. Token sẽ được sử dụng để gửi push notifications.',
    })
    @ApiBody({ type: RegisterDeviceTokenDto })
    @ApiResponse({
        status: 201,
        description: 'Đăng ký/cập nhật device token thành công',
        example: {
            success: true,
            message: 'Device token đã được đăng ký thành công',
            data: {
                id: 1,
                userId: 1,
                deviceToken: 'fcm_device_token_here',
                platform: 'android',
                createdAt: '2024-01-01T00:00:00.000Z',
            },
        },
    })
    @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
    async registerToken(
        @Body() registerDto: RegisterDeviceTokenDto,
        @User() user: JwtUser,
    ) {
        const deviceToken = await this.deviceTokenService.registerToken(
            user.id,
            registerDto.deviceToken,
            registerDto.platform,
        );

        return {
            success: true,
            message: 'Device token đã được đăng ký thành công',
            data: deviceToken,
        };
    }

    /**
     * Lấy danh sách device tokens của user hiện tại
     * GET /api/notifications/device-token
     */
    @Get()
    @ApiOperation({
        summary: 'Lấy danh sách device tokens của tôi',
        description:
            'API này trả về danh sách tất cả device tokens đã đăng ký của người dùng hiện tại.',
    })
    @ApiResponse({
        status: 200,
        description: 'Lấy danh sách device tokens thành công',
        example: {
            success: true,
            message: 'Lấy danh sách device tokens thành công',
            data: [
                {
                    id: 1,
                    userId: 1,
                    deviceToken: 'fcm_device_token_here',
                    platform: 'android',
                    createdAt: '2024-01-01T00:00:00.000Z',
                },
            ],
        },
    })
    @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
    async getUserTokens(@User() user: JwtUser) {
        const tokens = await this.deviceTokenService.getUserTokens(user.id);

        return {
            success: true,
            message: 'Lấy danh sách device tokens thành công',
            data: tokens,
        };
    }

    /**
     * Xóa device token
     * DELETE /api/notifications/device-token/:token
     */
    @Delete(':token')
    @ApiOperation({
        summary: 'Xóa device token',
        description:
            'API này cho phép xóa một device token cụ thể của người dùng hiện tại. Token sẽ không còn nhận được push notifications.',
    })
    @ApiParam({
        name: 'token',
        type: 'string',
        description: 'Device token cần xóa',
        example: 'fcm_device_token_here',
    })
    @ApiResponse({
        status: 200,
        description: 'Xóa device token thành công',
        example: {
            success: true,
            message: 'Device token đã được xóa thành công',
        },
    })
    @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
    async removeToken(@Param('token') token: string, @User() user: JwtUser) {
        await this.deviceTokenService.removeToken(user.id, token);

        return {
            success: true,
            message: 'Device token đã được xóa thành công',
        };
    }
}

