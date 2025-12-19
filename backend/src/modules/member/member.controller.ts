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
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { MemberService } from './member.service';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { User, Roles, Owner, JwtAuthGuard, RolesGuard, OwnerGuard, SelfOrAdminGuard } from 'src/common';
import type { JwtUser } from '../../common/types/user.type';
import { buildSuccessResponse, ResponseCode } from 'src/common/errors/error-codes';

@ApiTags('Members')
@Controller('api/members')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class MemberController {
  constructor(private readonly memberService: MemberService) { }

  /** Add member */
  @Post()
  @ApiOperation({ 
    summary: 'Thêm thành viên vào gia đình',
    description: 'API này cho phép owner hoặc admin thêm thành viên mới vào gia đình với vai trò cụ thể.'
  })
  @ApiBody({
    type: AddMemberDto,
    examples: {
      example1: {
        summary: 'Thêm thành viên',
        value: {
          family_id: 1,
          member_id: 2,
          role: 'member'
        }
      },
      example2: {
        summary: 'Thêm owner mới',
        value: {
          family_id: 1,
          member_id: 3,
          role: 'owner'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Thêm thành viên thành công',
    example: {
      id: 1,
      family_id: 1,
      member_id: 2,
      role: 'member',
      created_at: '2024-01-01T00:00:00.000Z'
    }
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 403, description: 'Không có quyền thêm thành viên vào gia đình này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy gia đình hoặc người dùng' })
  @ApiResponse({ status: 409, description: 'Thành viên đã tồn tại trong gia đình' })
  async addMember(@Body() dto: AddMemberDto, @User() user: JwtUser) {
    const data = await this.memberService.addMember(dto, user);
    return buildSuccessResponse(ResponseCode.C00219, data);
  }

  /** Update member role */
  @Put(':id')
  @ApiOperation({ 
    summary: 'Cập nhật vai trò thành viên',
    description: 'API này cho phép owner hoặc admin cập nhật vai trò của một thành viên trong gia đình (member hoặc owner).'
  })
  @ApiParam({ name: 'id', type: 'number', example: 1, description: 'ID của family member' })
  @ApiBody({
    type: UpdateMemberRoleDto,
    examples: {
      example1: {
        summary: 'Nâng cấp thành owner',
        value: {
          role: 'owner'
        }
      },
      example2: {
        summary: 'Hạ xuống thành member',
        value: {
          role: 'member'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cập nhật vai trò thành công',
    example: {
      id: 1,
      family_id: 1,
      member_id: 2,
      role: 'owner',
      updated_at: '2024-01-01T00:00:00.000Z'
    }
  })
  @ApiResponse({ status: 403, description: 'Không có quyền cập nhật vai trò thành viên này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thành viên' })
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMemberRoleDto,
    @User() user: JwtUser,
  ) {
    const data = await this.memberService.updateMemberRole(
      id,
      dto.role,
      user
    );
    return buildSuccessResponse(ResponseCode.C00220, data);
  }

  /** Remove member */
  @Delete(':id')
  @ApiOperation({ 
    summary: 'Xóa thành viên khỏi gia đình',
    description: 'API này cho phép owner hoặc admin xóa một thành viên khỏi gia đình. Lưu ý: Không thể xóa owner cuối cùng của gia đình.'
  })
  @ApiParam({ name: 'id', type: 'number', example: 1, description: 'ID của family member' })
  @ApiResponse({ 
    status: 200, 
    description: 'Xóa thành viên thành công',
    example: {
      message: 'Thành viên đã được xóa khỏi gia đình thành công'
    }
  })
  @ApiResponse({ status: 403, description: 'Không có quyền xóa thành viên này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thành viên' })
  @ApiResponse({ status: 400, description: 'Không thể xóa owner cuối cùng của gia đình' })
  async removeMember(
    @Param('id', ParseIntPipe) id: number,
    @User() user: JwtUser,
  ) {
    await this.memberService.removeMember(id, user);
    return buildSuccessResponse(ResponseCode.C00221, { member_id: id });
  }
}
