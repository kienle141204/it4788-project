import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('device_tokens')
export class DeviceToken {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'user_id', type: 'int' })
    userId: number;

    @ManyToOne(() => User, (user) => user.deviceTokens, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' }) // FK constraint
    user: User;

    @Column({ name: 'device_token', type: 'varchar', length: 255 })
    deviceToken: string;

    @Column({
        type: 'enum',
        enum: ['ios', 'android'],
    })
    platform: 'ios' | 'android';

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;
}
