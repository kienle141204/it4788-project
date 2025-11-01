import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { IngredientCategory } from './ingredient-category.entity';

@Entity('ingredients')
export class Ingredient {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'category_id', type: 'bigint', nullable: true })
  category_id: number;

  @Column({ name: 'name', length: 200 })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({ name: 'image_url', length: 255, nullable: true })
  image_url: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @Column({ name: 'place_id', type: 'int', nullable: true })
  place_id: number;

  // Quan hệ với IngredientCategory
  @ManyToOne(() => IngredientCategory, (category) => category.ingredients)
  @JoinColumn({ name: 'category_id' })
  category: IngredientCategory;

  // Quan hệ với Place
  @ManyToOne('Place', 'ingredients')
  @JoinColumn({ name: 'place_id' })
  place: any;
}
