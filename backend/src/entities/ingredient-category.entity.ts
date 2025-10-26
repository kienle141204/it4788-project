import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { Ingredient } from './ingredient.entity';

@Entity('ingredient_categories')
export class IngredientCategory {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'name', length: 100 })
  name: string;

  @OneToMany(() => Ingredient, (ingredient) => ingredient.category)
  ingredients: Ingredient[];
}
