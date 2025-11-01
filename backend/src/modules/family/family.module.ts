import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Family } from './entities/family.entity';
import { FamilyService } from './family.service';
import { FamilyController } from './family.controller';
import { MemberModule } from '../member/member.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Family]),
    MemberModule,
  ],
  controllers: [FamilyController],
  providers: [FamilyService],
  exports: [TypeOrmModule],
})
export class FamilyModule { }
