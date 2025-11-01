import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RecipeStep } from './recipe-step.entity';

@Entity('images')
export class Image {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'recipe_steps_id', type: 'bigint', nullable: true })
  recipe_steps_id: number;

  @Column({ name: 'url', length: 256, nullable: true })
  url: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => RecipeStep)
  @JoinColumn({ name: 'recipe_steps_id' })
  recipeStep: RecipeStep;
}
