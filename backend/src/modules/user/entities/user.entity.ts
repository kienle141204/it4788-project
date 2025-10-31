import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password_hash?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  full_name?: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  avatar_url?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  refresh_token?: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @Column({
    type: 'enum',
    enum: ['user', 'admin'],
    default: 'user',
  })
  role: 'user' | 'admin';

  @Column({ type: 'varchar', length: 255, nullable: true })
  address?: string;
}
