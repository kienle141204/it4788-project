import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';

@Entity('family_members')
@Unique(['family_id', 'user_id'])
export class Member {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  family_id: number; // chỉ lưu FK, không import Family entity

  @Column({ type: 'bigint' })
  user_id: number; // chỉ lưu FK, không import User entity

  @Column({
    type: 'enum',
    enum: ['member', 'manager'],
    default: 'member',
  })
  role: 'member' | 'manager';

  @CreateDateColumn({ type: 'timestamp' })
  joined_at: Date;
}
