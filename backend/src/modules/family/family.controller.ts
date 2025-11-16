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
import { User, Roles, Owner, JwtAuthGuard, RolesGuard, OwnerGuard, SelfOrAdminGuard } from 'src/common';
import type { JwtUser } from '../../common/types/user.type';
// import { FirebaseService } from '../../firebase/firebase.service';

@ApiTags('Families')
@Controller('api/families')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FamilyController {
  constructor(private readonly familyService: FamilyService,
    // private readonly firebaseService: FirebaseService,
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
    return this.familyService.createFamily(dto.name, ownerId, user);
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
    const member = this.familyService.addMember(req.family_id, req.member_id, req.role, user)
    return member
  }
  // @Post('test-push')
  // @ApiOperation({ summary: 'Thử gửi thông báo đến thiết bị có body.token' })
  // async sendTestPush(@Body() body: { token: string }) {
  //   return this.firebaseService.sendNotification(
  //     body.token,
  //     'Test Notification',
  //     'Hello from NestJS Firebase!'
  //   );
  // }

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

  @Get('my-family')
  @ApiOperation({ 
    summary: 'Lấy ra các nhóm gia đình có người dùng là thành viên',
    description: 'API này trả về danh sách tất cả các gia đình mà người dùng hiện tại là thành viên (owner hoặc member).'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lấy danh sách gia đình thành công',
    example: [
      {
        id: 1,
        name: 'Gia đình Nguyễn Văn A',
        owner_id: 1,
        role: 'owner',
        created_at: '2024-01-01T00:00:00.000Z'
      }
    ]
  })
  async getMyFamily(@User() user: JwtUser) {
    return this.familyService.getMyFamily(user.id)
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
