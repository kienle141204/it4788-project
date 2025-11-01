import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Refrigerator } from './refrigerator.entity';
import { Ingredient } from './ingredient.entity';

@Entity('fridge_ingredients')
export class FridgeIngredient {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'refrigerator_id', type: 'bigint' })
  refrigerator_id: number;

  @Column({ name: 'ingredient_id', type: 'bigint' })
  ingredient_id: number;

  @Column({ name: 'stock', type: 'int', default: 0 })
  stock: number;

  @Column({ name: 'price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => Refrigerator, (refrigerator) => refrigerator.fridgeIngredients)
  @JoinColumn({ name: 'refrigerator_id' })
  refrigerator: Refrigerator;

  @ManyToOne(() => Ingredient)
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: Ingredient;
}
