import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Dish } from './dish.entity';

@Entity('dishes_ingredients')
export class DishesIngredients {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'dish_id', type: 'bigint' })
  dish_id: number;

  @Column({ name: 'ingredient_name', length: 255 })
  ingredient_name: string;

  @Column({ name: 'quantity', length: 100, nullable: true })
  quantity: string;

  // Quan hệ với Dish
  @ManyToOne(() => Dish)
  @JoinColumn({ name: 'dish_id' })
  dish: Dish;
}

