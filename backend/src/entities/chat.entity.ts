import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Index,
} from 'typeorm';
import { Family } from './family.entity';

@Entity({ name: 'chat' })
@Index('idx_user_id', ['userId'])
export class Chat {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: number;

    @Column({ name: 'user_id', type: 'bigint' })
    userId: number;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'text' })
    message: string;

    @Column({ type: 'json', nullable: true })
    data?: Record<string, any>;

    @Column({
        name: 'is_read',
        type: 'tinyint',
        width: 1,
        default: () => '0',
    })
    isRead: boolean;

    @CreateDateColumn({
        name: 'created_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
    createdAt: Date;

    @Column({ name: 'family_id', type: 'bigint' })
    familyId: number;

    /* ================= Relations ================= */

    @ManyToOne(() => Family, (family) => family.chats, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'family_id' })
    family: Family;
}
