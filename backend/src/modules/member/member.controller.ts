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
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { MemberService } from './member.service';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { User, Roles, Owner, JwtAuthGuard, RolesGuard, OwnerGuard, SelfOrAdminGuard } from 'src/common';
import type { JwtUser } from '../../common/types/user.type';

@ApiTags('Members')
@Controller('api/members')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class MemberController {
  constructor(private readonly memberService: MemberService) { }

  /** Add member */
  @Post()
  @ApiOperation({ summary: 'Thêm thành viên vào gia đình' })
  async addMember(@Body() dto: AddMemberDto, @User() user: JwtUser) {
    return this.memberService.addMember(dto, user);
  }

  /** Update member role */
  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật vai trò cho người trong gia đình' })
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMemberRoleDto,
    @User() user: JwtUser,
  ) {
    return this.memberService.updateMemberRole(
      id,
      dto.role,
      user
    );
  }

  /** Remove member */
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa thành viên khỏi gia đình' })
  async removeMember(
    @Param('id', ParseIntPipe) id: number,
    @User() user: JwtUser,
  ) {
    return this.memberService.removeMember(id, user);
  }
}
