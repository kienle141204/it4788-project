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
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { FamilyService } from './family.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { JoinByCodeDto } from './dto/join-by-code.dto';
import { User, Roles, Owner, JwtAuthGuard, RolesGuard, OwnerGuard, SelfOrAdminGuard } from 'src/common';
import type { JwtUser } from '../../common/types/user.type';
import { FirebaseService } from '../../firebase/firebase.service';
import { buildSuccessResponse, ResponseCode } from 'src/common/errors/error-codes';

@ApiTags('Families')
@Controller('api/families')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FamilyController {
  constructor(private readonly familyService: FamilyService,
    private readonly firebaseService: FirebaseService,
  ) { }
  /** Create family */
  @Post()
  @ApiOperation({
    summary: 'Tạo gia đình mới',
    description: 'API này cho phép người dùng tạo một gia đình mới. Admin có thể tạo gia đình cho người khác bằng cách chỉ định owner_id.'
  })
  @ApiBody({
    type: CreateFamilyDto,
    examples: {
      example1: {
        summary: 'Tạo gia đình mới',
        value: {
          name: 'Gia đình Nguyễn Văn A'
        }
      },
      example2: {
        summary: 'Admin tạo gia đình cho người khác',
        value: {
          name: 'Gia đình Trần Thị B',
          owner_id: 2
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Tạo gia đình thành công',
    example: {
      id: 1,
      name: 'Gia đình Nguyễn Văn A',
      owner_id: 1,
      created_at: '2024-01-01T00:00:00.000Z'
    }
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async createFamily(@Body() dto: CreateFamilyDto, @User() user: JwtUser) {
    const ownerId = user.role === 'admin' ? (dto.owner_id ?? user.id) : user.id;
    const data = await this.familyService.createFamily(dto.name, ownerId, user);
    return buildSuccessResponse(ResponseCode.C00197, data);
  }

  @Post('add-member')
  @ApiOperation({
    summary: 'Thêm thành viên vào gia đình',
    description: 'API này cho phép owner hoặc admin thêm thành viên mới vào gia đình với vai trò cụ thể (owner, member).'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        family_id: { type: 'number', example: 1, description: 'ID của gia đình' },
        member_id: { type: 'number', example: 2, description: 'ID của người dùng cần thêm' },
        role: { type: 'string', enum: ['owner', 'member'], example: 'member', description: 'Vai trò của thành viên' }
      },
      required: ['family_id', 'member_id', 'role']
    },
    examples: {
      example1: {
        summary: 'Thêm thành viên',
        value: {
          family_id: 1,
          member_id: 2,
          role: 'member'
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
  @ApiResponse({ status: 403, description: 'Không có quyền thêm thành viên' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy gia đình hoặc người dùng' })
  async addMember(@Body() req: any, @User() user: JwtUser) {
    const data = await this.familyService.addMember(req.family_id, req.member_id, req.role, user);
    return buildSuccessResponse(ResponseCode.C00198, data);
  }

  /** Join family by invitation code */
  @Post('join-by-code')
  @ApiOperation({ 
    summary: 'Tham gia gia đình bằng mã mời',
    description: 'Người dùng nhập mã mời hợp lệ để trở thành thành viên của gia đình tương ứng.'
  })
  @ApiBody({
    type: JoinByCodeDto,
    examples: {
      default: {
        summary: 'Gia nhập bằng mã',
        value: {
          invitation_code: 'FAM-123-XYZ'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Gia nhập gia đình thành công',
    example: {
      family_id: 5,
      member_id: 12,
      role: 'member',
      joined_at: '2024-03-15T12:00:00.000Z'
    }
  })
  @ApiResponse({ status: 400, description: 'Mã mời không hợp lệ hoặc đã hết hạn' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy gia đình tương ứng với mã mời' })
  async joinByCode(
    @Body() dto: JoinByCodeDto,
    @User() user: JwtUser,
  ) {
    const data = await this.familyService.joinFamilyByCode(dto.invitation_code, user);
    return buildSuccessResponse(ResponseCode.C00199, data);
  }

  /** Leave family */
  @Post(':id/leave')
  @ApiOperation({ 
    summary: 'Rời khỏi gia đình',
    description: 'Cho phép thành viên rời khỏi một gia đình cụ thể. Owner phải chuyển quyền trước khi rời nhóm.'
  })
  @ApiParam({ name: 'id', type: 'number', example: 3, description: 'ID gia đình muốn rời khỏi' })
  @ApiResponse({
    status: 200,
    description: 'Rời gia đình thành công',
    example: {
      message: 'Bạn đã rời gia đình thành công',
      family_id: 3
    }
  })
  @ApiResponse({ status: 403, description: 'Không có quyền rời gia đình (ví dụ: owner chưa chuyển quyền)' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy gia đình' })
  async leaveFamily(
    @Param('id', ParseIntPipe) id: number,
    @User() user: JwtUser,
  ) {
    const data = await this.familyService.leaveFamily(id, user.id);
    return buildSuccessResponse(ResponseCode.C00200, data);
  }

  @Post('test-push')
  @ApiOperation({ 
    summary: 'Thử gửi thông báo đến thiết bị có body.token',
    description: 'Dùng nội bộ để kiểm tra cấu hình Firebase Cloud Messaging bằng cách gửi thông báo thử đến một token thiết bị.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', example: 'fcm_device_token_here', description: 'FCM registration token của thiết bị' }
      },
      required: ['token']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Gửi thông báo thành công',
    example: {
      messageId: 'projects/demo/messages/0:1700000000000000%1234567890abcdef',
      success: true
    }
  })
  async sendTestPush(@Body() body: { token: string }) {
    return this.firebaseService.sendNotification(
      body.token,
      'Test Notification',
      'Hello from NestJS Firebase!'
    );
  }

  /** Get all families */
  @Get()
  @ApiOperation({
    summary: 'Lấy ra toàn bộ gia đình',
    description: 'API này trả về danh sách tất cả các gia đình trong hệ thống. Yêu cầu quyền admin.'
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách gia đình thành công',
    example: [
      {
        id: 1,
        name: 'Gia đình Nguyễn Văn A',
        owner_id: 1,
        created_at: '2024-01-01T00:00:00.000Z'
      }
    ]
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền admin' })
  async getAllFamilies() {
    return this.familyService.getAllFamilies();
  }

  @Get('my-family')
  @ApiOperation({ summary: 'Lấy ra các nhóm gia đình có người dùng là thành viên' })
  async getMyFamily(@User() user: JwtUser) {
    return this.familyService.getMyFamily(user.id)
  }

  /** Get family members with user details */
  @Get(':id/members')
  @ApiOperation({ 
    summary: 'Lấy danh sách thành viên của gia đình kèm thông tin chi tiết',
    description: 'API này trả về danh sách thành viên của gia đình với thông tin user (tên, email, avatar, vai trò). Chỉ members của gia đình mới có thể xem.'
  })
  @ApiParam({ name: 'id', type: 'number', example: 1, description: 'ID của gia đình' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách thành viên thành công',
    example: [
      {
        id: 1,
        user_id: 1,
        role: 'manager',
        joined_at: '2024-01-01T00:00:00.000Z',
        user: {
          id: 1,
          full_name: 'Nguyễn Văn A',
          email: 'nguyenvana@example.com',
          avatar_url: 'https://example.com/avatar.jpg'
        }
      }
    ]
  })
  @ApiResponse({ status: 403, description: 'Không có quyền xem danh sách thành viên' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy gia đình' })
  async getFamilyMembers(
    @Param('id', ParseIntPipe) id: number,
    @User() user: JwtUser,
  ) {
    return this.familyService.getFamilyMembersWithDetails(id, user.id);
  }

  /** Get invitation code and QR code */
  @Get(':id/invitation')
  @ApiOperation({ 
    summary: 'Lấy mã mời và QR code của gia đình',
    description: 'Owner hoặc admin có thể lấy mã mời và QR code để chia sẻ với người dùng khác.'
  })
  @ApiParam({ name: 'id', type: 'number', example: 4, description: 'ID của gia đình cần lấy mã mời' })
  @ApiResponse({
    status: 200,
    description: 'Lấy mã mời thành công',
    example: {
      family_id: 4,
      invitation_code: 'FAM-XYZ-789',
      qr_code: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...',
      expired_at: '2024-04-01T00:00:00.000Z'
    }
  })
  @ApiResponse({ status: 403, description: 'Không có quyền lấy mã mời của gia đình này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy gia đình' })
  async getInvitationCode(
    @Param('id', ParseIntPipe) id: number,
    @User() user: JwtUser,
  ) {
    return this.familyService.getInvitationCode(id, user.id, user.role);
  }

  /** Get family by ID */
  @Get(':id')
  @ApiOperation({
    summary: 'Lấy gia đình theo id',
    description: 'API này trả về thông tin chi tiết của một gia đình theo ID, bao gồm danh sách thành viên.'
  })
  @ApiParam({ name: 'id', type: 'number', example: 1, description: 'ID của gia đình' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin gia đình thành công',
    example: {
      id: 1,
      name: 'Gia đình Nguyễn Văn A',
      owner_id: 1,
      members: [
        {
          id: 1,
          user_id: 1,
          role: 'owner'
        }
      ],
      created_at: '2024-01-01T00:00:00.000Z'
    }
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy gia đình' })
  async getFamilyById(@Param('id', ParseIntPipe) id: number) {
    return this.familyService.getFamilyById(id);
  }

  /** Update family */
  @Put(':id')
  @ApiOperation({
    summary: 'Cập nhật gia đình',
    description: 'API này cho phép owner hoặc admin cập nhật thông tin gia đình như tên hoặc chuyển quyền owner cho người khác.'
  })
  @ApiParam({ name: 'id', type: 'number', example: 1, description: 'ID của gia đình' })
  @ApiBody({
    type: UpdateFamilyDto,
    examples: {
      example1: {
        summary: 'Đổi tên gia đình',
        value: {
          name: 'Gia đình Nguyễn Văn B'
        }
      },
      example2: {
        summary: 'Chuyển quyền owner',
        value: {
          owner_id: 2
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật gia đình thành công',
    example: {
      id: 1,
      name: 'Gia đình Nguyễn Văn B',
      owner_id: 1,
      updated_at: '2024-01-01T00:00:00.000Z'
    }
  })
  @ApiResponse({ status: 403, description: 'Không có quyền cập nhật' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy gia đình' })
  async updateFamily(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFamilyDto,
    @User() user: JwtUser,
  ) {
    return this.familyService.updateFamily(id, dto, user.id, user.role);
  }

  /** Delete family */
  @ApiOperation({
    summary: 'Xóa gia đình',
    description: 'API này cho phép owner hoặc admin xóa gia đình. Lưu ý: Hành động này không thể hoàn tác.'
  })
  @ApiParam({ name: 'id', type: 'number', example: 1, description: 'ID của gia đình' })
  @Delete(':id')
  @ApiResponse({
    status: 200,
    description: 'Xóa gia đình thành công',
    example: {
      message: 'Family 1 deleted successfully'
    }
  })
  @ApiResponse({ status: 403, description: 'Không có quyền xóa' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy gia đình' })
  async deleteFamily(
    @Param('id', ParseIntPipe) id: number,
    @User() user: JwtUser,
  ) {
    await this.familyService.deleteFamily(id, user.id, user.role);
    return { message: `Family ${id} deleted successfully` };
  }
}