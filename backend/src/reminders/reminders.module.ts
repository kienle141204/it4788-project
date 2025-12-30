// reminders.module.ts
import { Module } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Family } from 'src/entities/family.entity';
import { FamilyMember } from 'src/entities/family-member.entity';
import { FridgeDish } from '../entities/fridge-dish.entity'
import { FridgeIngredient } from '../entities/fridge-ingredient.entity'
import { Refrigerator } from '../entities/refrigerator.entity';
import { FirebaseModule } from 'src/firebase/firebase.module';
import { DeviceToken } from '../entities/device-token.entity';
import { NotificationsModule } from '../modules/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FridgeDish, FridgeIngredient, Family, FamilyMember, DeviceToken, Refrigerator]), 
    FirebaseModule,
    NotificationsModule,
  ],
  providers: [RemindersService],
})
export class RemindersModule { }
