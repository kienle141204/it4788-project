import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Recipe } from './recipe.entity';
import { Image } from './image.entity';

@Entity('recipe_steps')
export class RecipeStep {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'recipe_id', type: 'bigint' })
  recipe_id: number;

  @Column({ name: 'step_number', type: 'int' })
  step_number: number;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  // Quan hệ với Recipe
  @ManyToOne(() => Recipe, (recipe) => recipe.steps)
  @JoinColumn({ name: 'recipe_id' })
  recipe: Recipe;

  // Quan hệ với Image
  @OneToMany(() => Image, (image) => image.recipeStep)
  images: Image[];
}
