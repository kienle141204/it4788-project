import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { FamilyMember } from './family-member.entity';

@Entity('families')
export class Family {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'name', length: 150 })
  name: string;

  @Column({ name: 'owner_id', type: 'bigint' })
  owner_id: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  // Quan hệ với User (chủ sở hữu)
  @ManyToOne(() => User, (user) => user.ownedFamilies)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  // Quan hệ với FamilyMember (các thành viên trong gia đình)
  @OneToMany(() => FamilyMember, (familyMember) => familyMember.family)
  members: FamilyMember[];
}

