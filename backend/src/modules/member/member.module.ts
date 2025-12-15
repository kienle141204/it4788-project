import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FamilyMember } from '../../entities/family-member.entity';
import { MemberService } from './member.service';
import { MemberController } from './member.controller';
import { Family } from 'src/entities/family.entity';
import { User } from '../../entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FamilyMember, Family, User]),
    forwardRef(() => NotificationsModule),
  ],
  providers: [MemberService],
  controllers: [MemberController],
  exports: [MemberService],
})
export class MemberModule { }
