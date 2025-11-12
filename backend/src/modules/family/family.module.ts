import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Family } from '../../entities/family.entity';
import { FamilyService } from './family.service';
import { FamilyController } from './family.controller';
import { MemberModule } from '../member/member.module';
import { FirebaseModule } from '../../firebase/firebase.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Family]),
    MemberModule,
    FirebaseModule,
  ],
  controllers: [FamilyController],
  providers: [FamilyService],
  exports: [FamilyService],
})
export class FamilyModule { }
