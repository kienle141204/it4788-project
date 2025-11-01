import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';

@Entity('place')
export class Place {
  @PrimaryGeneratedColumn({ name: 'place_id' })
  place_id: number;

  @Column({ name: 'name_place', length: 50 })
  name_place: string;

  // Quan hệ với Ingredient
  @OneToMany('Ingredient', 'place')
  ingredients: any[];
}
