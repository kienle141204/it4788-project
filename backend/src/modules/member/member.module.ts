import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FamilyMember } from '../../entities/family-member.entity';
import { MemberService } from './member.service';
import { MemberController } from './member.controller';
import { Family } from 'src/entities/family.entity';
import { User } from '../../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FamilyMember, Family, User])],
  providers: [MemberService],
  controllers: [MemberController],
  exports: [MemberService],
})
export class MemberModule { }
