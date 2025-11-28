import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Family } from './family.entity';
import { User } from './user.entity';
import { Dish } from './dish.entity';
import { Ingredient } from './ingredient.entity';

@Entity('consumption_history')
export class ConsumptionHistory {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ type: 'bigint' })
    family_id: number;

    @Column({ type: 'bigint' })
    user_id: number;

    @Column({
        type: 'enum',
        enum: ['dish', 'ingredient'],
    })
    consume_type: 'dish' | 'ingredient';

    @Column({ type: 'bigint' })
    item_id: number; // dish_id hoặc ingredient_id

    @Column({ type: 'int' })
    stock: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    value: number | null; // tổng tiền (optional)

    @Column({
        type: 'bigint',
        nullable: true,
    })

    @CreateDateColumn()
    created_at: Date;

    /** Relations */

    @ManyToOne(() => Family)
    @JoinColumn({ name: 'family_id' })
    family: Family;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;


    @ManyToOne(() => Dish, { nullable: true })
    @JoinColumn({ name: 'item_id' })
    dish: Dish;

    @ManyToOne(() => Ingredient, { nullable: true })
    @JoinColumn({ name: 'item_id' })
    ingredient: Ingredient;
}
