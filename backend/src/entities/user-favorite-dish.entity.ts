import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Dish } from './dish.entity';

@Entity('user_favorite_dishes')
export class UserFavoriteDish {
  @PrimaryColumn({ name: 'user_id', type: 'bigint' })
  user_id: number;

  @PrimaryColumn({ name: 'dish_id', type: 'bigint' })
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

