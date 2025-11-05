import {
  Controller,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MemberService, UserRole, FamilyMemberRole } from './member.service';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { User } from '../../common/decorators/user.decorator';
import type { JwtUser } from '../../common/types/user.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Members')
@Controller('members')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class MemberController {
  constructor(private readonly memberService: MemberService) { }

  /** ➕ Add member */
  @Post()
  async addMember(@Body() dto: AddMemberDto, @User() user: JwtUser) {
    return this.memberService.addMember(dto, user.id, user.role as UserRole);
  }

  /** ✏️ Update member role */
  @Put(':id')
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMemberRoleDto,
    @User() user: JwtUser,
  ) {
    return this.memberService.updateMemberRole(
      id,
      dto.role as FamilyMemberRole,
      user.id,
      user.role as UserRole,
    );
  }

  /** ❌ Remove member */
  @Delete(':id')
  async removeMember(
    @Param('id', ParseIntPipe) id: number,
    @User() user: JwtUser,
  ) {
    return this.memberService.removeMember(id, user.id, user.role as UserRole);
  }
}
