import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Menu } from './menu.entity';
import { Dish } from './dish.entity';

@Entity('menu_dishes')
export class MenuDish {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'menu_id', type: 'bigint' })
  menu_id: number;

  @Column({ name: 'dish_id', type: 'bigint' })
  dish_id: number;

  @Column({ name: 'stock', type: 'int', default: 0 })
  stock: number;

  @Column({ name: 'price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => Menu, (menu) => menu.menuDishes)
  @JoinColumn({ name: 'menu_id' })
  menu: Menu;

  @ManyToOne(() => Dish)
  @JoinColumn({ name: 'dish_id' })
  dish: Dish;
}
