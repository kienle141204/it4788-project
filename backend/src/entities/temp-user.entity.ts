import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('temp_user')
export class TempUser {
  @PrimaryGeneratedColumn({ name: 'temp_user_id' })
  temp_user_id: number;

  @Column({ name: 'email', unique: true, length: 255 })
  email: string;

  @Column({ name: 'phone_number', nullable: true, length: 20 })
  phone_number: string;

  @Column({ name: 'password_hash', length: 255 })
  @Exclude()
  password_hash: string;

  @Column({ name: 'otp_code', length: 10 })
  otp_code: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ['PENDING', 'VERIFIED', 'EXPIRED'],
    default: 'PENDING',
  })
  status: string;

  @CreateDateColumn({ name: 'tp_sent_at' })
  tp_sent_at: Date;

}

