import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Refrigerator } from './refrigerator.entity';
import { Dish } from './dish.entity';

@Entity('fridge_dishes')
export class FridgeDish {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'refrigerator_id', type: 'bigint' })
  refrigerator_id: number;

  @Column({ name: 'dish_id', type: 'bigint' })
  dish_id: number;

  @Column({ name: 'stock', type: 'int', default: 0 })
  stock: number;

  @Column({ name: 'price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => Refrigerator, (refrigerator) => refrigerator.fridgeDishes)
  @JoinColumn({ name: 'refrigerator_id' })
  refrigerator: Refrigerator;

  // Quan hệ với Dish
  @ManyToOne(() => Dish)
  @JoinColumn({ name: 'dish_id' })
  dish: Dish;
}
