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

export enum MenuTime {
  BREAKFAST = 'breakfast',
  MORNING_SNACK = 'morning_snack',
  LUNCH = 'lunch',
  AFTERNOON_SNACK = 'afternoon_snack',
  DINNER = 'dinner',
  LATE_NIGHT = 'late_night',
}

@Entity('menus')
export class Menu {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'family_id', type: 'bigint' })
  family_id: number;

  @Column({
    name: 'time',
    type: 'enum',
    enum: MenuTime,
    nullable: true,
    default: null,
  })
  time: MenuTime | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @Column({ name: 'decription', type: 'text', nullable: true })
  description: string | null;

  // Quan hệ với Family
  @ManyToOne(() => Family)
  @JoinColumn({ name: 'family_id' })
  family: Family;

  // Quan hệ với MenuDish (sử dụng forwardRef để tránh circular dependency)
  @OneToMany('MenuDish', 'menu')
  menuDishes: any[];
}
