import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Family } from './family.entity';

@Entity('menus')
export class Menu {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'family_id', type: 'bigint' })
  family_id: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @Column({ name: 'decription', type: 'text', nullable: true })
  description: string;

  // Quan hệ với Family
  @ManyToOne(() => Family)
  @JoinColumn({ name: 'family_id' })
  family: Family;

  // Quan hệ với MenuDish (sử dụng forwardRef để tránh circular dependency)
  @OneToMany('MenuDish', 'menu')
  menuDishes: any[];
}
