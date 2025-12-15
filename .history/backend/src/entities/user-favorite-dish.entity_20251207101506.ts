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
import { Dish } from './dish.entity';

@Entity('user_favorite_dishes')
@Unique(['user_id', 'dish_id'])
export class UserFavoriteDish {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'user_id', type: 'bigint' })
  user_id: number;

  @Column({ name: 'dish_id', type: 'bigint' })
  dish_id: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Dish)
  @JoinColumn({ name: 'dish_id' })
  dish: Dish;
}

