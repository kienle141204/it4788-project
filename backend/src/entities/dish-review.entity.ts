import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Dish } from './dish.entity';
import { User } from './user.entity';

@Entity('dish_reviews')
export class DishReview {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'dish_id', type: 'bigint' })
  dish_id: number;

  @Column({ name: 'user_id', type: 'bigint' })
  user_id: number;

  @Column({ name: 'rating', type: 'int' })
  rating: number;

  @Column({ name: 'comment', type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  // Quan hệ với Dish
  @ManyToOne(() => Dish)
  @JoinColumn({ name: 'dish_id' })
  dish: Dish;

  // Quan hệ với User
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}