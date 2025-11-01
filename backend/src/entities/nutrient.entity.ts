import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';

@Entity('nutrients')
export class Nutrient {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  // Quan hệ many-to-many với Dish (sử dụng forwardRef để tránh circular dependency)
  @ManyToMany('Dish', 'nutrients')
  @JoinTable({
    name: 'dish_nutrients',
    joinColumn: { name: 'nutrient_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'dish_id', referencedColumnName: 'id' },
  })
  dishes: any[];
}
