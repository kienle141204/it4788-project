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
import { Menu } from './menu.entity';
import { ShoppingList } from './shopping-list.entity';
import { FamilyNote } from './family-note.entity';
import { Chat } from './chat.entity';

@Entity('families')
export class Family {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'name', length: 150 })
  name: string;

  @Column({ name: 'owner_id', type: 'bigint' })
  owner_id: number;

  @Column({ name: 'invitation_code', unique: true, length: 50, nullable: true })
  invitation_code: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => User, (user) => user.ownedFamilies)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @OneToMany(() => FamilyMember, (familyMember) => familyMember.family)
  members: FamilyMember[];

  @OneToMany(() => Menu, (menu) => menu.family)
  menus: Menu[];

  @OneToMany(() => ShoppingList, (shoppingList) => shoppingList.family)
  shoppingLists: ShoppingList[];

  @OneToMany(() => FamilyNote, (familyNote) => familyNote.family)
  notes: FamilyNote[];

  @OneToMany(() => Chat, (chat) => chat.family)
  chats: Chat[];
}

