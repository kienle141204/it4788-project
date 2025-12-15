import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Family } from './family.entity';

@Entity('refrigerators')
export class Refrigerator {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'owner_id', type: 'bigint' })
  owner_id: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @Column({ name: 'family_id', type: 'bigint', nullable: true })
  family_id: number;

  // Quan hệ với User (người sở hữu)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  // Quan hệ với Family
  @ManyToOne(() => Family)
  @JoinColumn({ name: 'family_id' })
  family: Family;

  // Quan hệ với FridgeIngredient (sử dụng forwardRef để tránh circular dependency)
  @OneToMany('FridgeIngredient', 'refrigerator')
  fridgeIngredients: any[];

  // Quan hệ với FridgeDish (sử dụng forwardRef để tránh circular dependency)
  @OneToMany('FridgeDish', 'refrigerator')
  fridgeDishes: any[];
}
