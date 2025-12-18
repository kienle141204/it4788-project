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
import { DishesIngredients } from './dishes-ingredients.entity';

@Entity('fridge_ingredients')
export class FridgeIngredient {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'refrigerator_id', type: 'bigint' })
  refrigerator_id: number;

  @Column({ name: 'ingredient_id', type: 'bigint', nullable: true })
  ingredient_id: number | null;

  @Column({ name: 'dish_ingredient_id', type: 'int', unsigned: true, nullable: true })
  dish_ingredient_id: number | null;

  @Column({ name: 'stock', type: 'int', default: 0 })
  stock: number;

  @Column({
    name: 'price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  price: number | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @Column({ name: 'expiration_date', type: 'date', nullable: true })
  expiration_date: Date | null;

  // -----------------------
  // Relations
  // -----------------------

  @ManyToOne(() => Refrigerator, (refrigerator) => refrigerator.fridgeIngredients)
  @JoinColumn({ name: 'refrigerator_id' })
  refrigerator: Refrigerator;

  @ManyToOne(() => Ingredient, { nullable: true })
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: Ingredient | null;

  @ManyToOne(() => DishesIngredients, { nullable: true })
  @JoinColumn({ name: 'dish_ingredient_id' })
  dishIngredient: DishesIngredients | null;
}
