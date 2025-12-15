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

@Entity('shopping_lists')
export class ShoppingList {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'owner_id', type: 'bigint' })
  owner_id: number;

  @Column({ name: 'cost', type: 'decimal', precision: 10, scale: 2, default: 0.00 })
  cost: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @Column({ name: 'family_id', type: 'bigint', nullable: true })
  family_id: number;

  @Column({ name: 'is_shared', type: 'boolean', default: false })
  is_shared: boolean;

  @Column({ name: 'shopping_date' })
  shopping_date: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @ManyToOne(() => Family)
  @JoinColumn({ name: 'family_id' })
  family: Family;

  @OneToMany('ShoppingItem', 'shoppingList')
  items: any[];
}
