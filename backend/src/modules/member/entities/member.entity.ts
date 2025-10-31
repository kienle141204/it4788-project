import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Family } from '../family/family.entity';

@Entity('family_members')
@Unique(['family_id', 'user_id'])
export class Member {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  family_id: number;

  @Column({ type: 'bigint' })
  user_id: number;

  @Column({
    type: 'enum',
    enum: ['member', 'manager'],
    default: 'member',
  })
  role: 'member' | 'manager';

  @CreateDateColumn({ type: 'timestamp' })
  joined_at: Date;

  // Quan hệ (optional, để join dữ liệu)
  @ManyToOne(() => Family, (family) => family.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'family_id' })
  family: Family;
}
