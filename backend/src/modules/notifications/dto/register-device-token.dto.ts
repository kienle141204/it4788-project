import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNotEmpty } from 'class-validator';

export class RegisterDeviceTokenDto {
    @ApiProperty({
        description: 'FCM device token từ client app',
        example: 'fcm_device_token_here_123456789',
    })
    @IsString()
    @IsNotEmpty()
    deviceToken: string;

    @ApiProperty({
        description: 'Platform của thiết bị',
        enum: ['ios', 'android'],
        example: 'android',
    })
    @IsEnum(['ios', 'android'])
    @IsNotEmpty()
    platform: 'ios' | 'android';
}

