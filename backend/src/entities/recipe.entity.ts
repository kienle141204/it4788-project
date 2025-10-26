import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Dish } from './dish.entity';
import { User } from './user.entity';

@Entity('recipes')
export class Recipe {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'dish_id', type: 'bigint' })
  dish_id: number;

  @Column({ name: 'owner_id', type: 'bigint' })
  owner_id: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ['public', 'private'],
    default: 'public',
  })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  // Quan hệ với Dish
  @ManyToOne(() => Dish, (dish) => dish.recipes)
  @JoinColumn({ name: 'dish_id' })
  dish: Dish;

  // Quan hệ với User (người tạo recipe)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  // Quan hệ với RecipeStep (sử dụng forwardRef để tránh circular dependency)
  @OneToMany('RecipeStep', 'recipe')
  steps: any[];
}
