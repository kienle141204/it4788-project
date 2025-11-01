import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ShoppingList } from './shopping-list.entity';
import { Ingredient } from './ingredient.entity';

@Entity('shopping_items')
export class ShoppingItem {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'list_id', type: 'bigint' })
  list_id: number;

  @Column({ name: 'ingredient_id', type: 'bigint' })
  ingredient_id: number;

  @Column({ name: 'stock', type: 'int', default: 0 })
  stock: number;

  @Column({ name: 'price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({ name: 'is_checked', type: 'boolean', nullable: true })
  is_checked: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => ShoppingList, (shoppingList) => shoppingList.items)
  @JoinColumn({ name: 'list_id' })
  shoppingList: ShoppingList;

  @ManyToOne(() => Ingredient)
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: Ingredient;
}
