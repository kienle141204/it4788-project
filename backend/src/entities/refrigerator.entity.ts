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

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @ManyToOne(() => Family)
  @JoinColumn({ name: 'family_id' })
  family: Family;

  @OneToMany('FridgeIngredient', 'refrigerator')
  fridgeIngredients: any[];

  @OneToMany('FridgeDish', 'refrigerator')
  fridgeDishes: any[];
}
