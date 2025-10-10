import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Family } from './family.entity';

@Entity('family_members')
@Unique(['family_id', 'user_id'])
export class FamilyMember {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'family_id', type: 'bigint' })
  family_id: number;

  @Column({ name: 'user_id', type: 'bigint' })
  user_id: number;

  @Column({
    name: 'role',
    type: 'enum',
    enum: ['member', 'manager'],
    default: 'member',
  })
  role: string;

  @CreateDateColumn({ name: 'joined_at' })
  joined_at: Date;

  // Quan hệ với Family
  @ManyToOne(() => Family, (family) => family.members)
  @JoinColumn({ name: 'family_id' })
  family: Family;

  // Quan hệ với User
  @ManyToOne(() => User, (user) => user.familyMemberships)
  @JoinColumn({ name: 'user_id' })
  user: User;
}


