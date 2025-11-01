import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('dishes')
export class Dish {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'name', length: 200 })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'image_url', length: 500, nullable: true })
  image_url: string;

  @Column({ name: 'owner_id', type: 'bigint', nullable: true, select: false })
  owner_id?: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  // Quan hệ với User (người sở hữu món ăn)
  @ManyToOne('User')
  @JoinColumn({ name: 'owner_id' })
  owner: any;

  // Quan hệ với Recipe (sử dụng forwardRef để tránh circular dependency)
  @OneToMany('Recipe', 'dish')
  recipes: any[];

  // Quan hệ many-to-many với Nutrient (sử dụng forwardRef để tránh circular dependency)
  @ManyToMany('Nutrient', 'dishes')
  nutrients: any[];
}
