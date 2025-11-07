import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Family } from './family.entity';
import { User } from './user.entity';

@Entity('family_notes')
export class FamilyNote {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'family_id', type: 'bigint' })
  family_id: number;

  @Column({ name: 'owner_id', type: 'bigint' })
  owner_id: number;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({
    name: 'type',
    type: 'enum',
    enum: ['reminder', 'shopping', 'info'],
    nullable: true,
  })
  type: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => Family)
  @JoinColumn({ name: 'family_id' })
  family: Family;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;
}
