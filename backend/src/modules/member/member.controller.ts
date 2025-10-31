import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MemberService } from './member.service';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

type AuthUser = {
  id: number;
  role: string;
};

@Controller('members')
@UseGuards(JwtAuthGuard) // All endpoints require auth
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Post()
  async addMember(@Body() dto: AddMemberDto, user: AuthUser) {
    return this.memberService.addMember(dto, user);
  }

  @Get('family/:family_id')
  async getMembersByFamily(
    @Param('family_id', ParseIntPipe) family_id: number,
  ) {
    return this.memberService.getMembersByFamily(family_id);
  }

  @Get(':id')
  async getMember(@Param('id', ParseIntPipe) id: number) {
    return this.memberService.getMember(id);
  }

  @Put(':id')
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMemberRoleDto,
    user: AuthUser,
  ) {
    return this.memberService.updateMemberRole(id, dto.role, user);
  }

  @Delete(':id')
  async removeMember(@Param('id', ParseIntPipe) id: number, user: AuthUser) {
    return this.memberService.removeMember(id, user);
  }
}
