import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Family } from './family.entity';
import { FamilyMember } from './family-member.entity';
import { Recipe } from './recipe.entity';
import { ShoppingList } from './shopping-list.entity';
import { FamilyNote } from './family-note.entity';
import { DeviceToken } from './device-token.entity';
import { Notification } from './notification.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'email', unique: true, length: 255 })
  email: string;

  @Column({ name: 'phone', length: 20 })
  phone: string;

  @Column({ name: 'password_hash', nullable: true, length: 255 })
  @Exclude()
  password_hash: string;

  @Column({ name: 'full_name', nullable: true, length: 150 })
  full_name: string;

  @Column({ name: 'avatar_url', nullable: true, length: 512 })
  avatar_url: string;

  @Column({ name: 'refresh_token', nullable: true, length: 255 })
  @Exclude()
  refresh_token: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @Column({
    name: 'role',
    type: 'enum',
    enum: ['user', 'admin'],
    default: 'user',
  })
  role: string;

  @Column({ name: 'address', nullable: true, length: 255 })
  @Exclude()
  address: string;

  @Column({
    name: 'profile_status',
    type: 'enum',
    enum: ['public', 'private'],
    default: 'public',
  })
  profile_status: string;

  @OneToMany(() => Family, (family) => family.owner)
  ownedFamilies: Family[];

  @OneToMany(() => FamilyMember, (familyMember) => familyMember.user)
  familyMemberships: FamilyMember[];

  @OneToMany(() => Recipe, (recipe) => recipe.owner)
  recipes: Recipe[];

  @OneToMany(() => ShoppingList, (shoppingList) => shoppingList.owner)
  shoppingLists: ShoppingList[];

  @OneToMany(() => FamilyNote, (familyNote) => familyNote.owner)
  familyNotes: FamilyNote[];

  @OneToMany(() => DeviceToken, (token) => token.user)
  deviceTokens: DeviceToken[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

}
