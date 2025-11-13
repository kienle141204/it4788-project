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
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { FamilyService } from './family.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { User, Roles, Owner, JwtAuthGuard, RolesGuard, OwnerGuard, SelfOrAdminGuard } from 'src/common';
import type { JwtUser } from '../../common/types/user.type';
import { FirebaseService } from '../../firebase/firebase.service';

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
  @ApiOperation({ summary: 'Tạo gia đình mới' })
  async createFamily(@Body() dto: CreateFamilyDto, @User() user: JwtUser) {
    const ownerId = user.role === 'admin' ? (dto.owner_id ?? user.id) : user.id;
    return this.familyService.createFamily(dto.name, ownerId, user);
  }

  @Post('add-member')
  @ApiOperation({ summary: 'Thêm thành viên vào gia đình' })
  async addMember(@Body() req: any, @User() user: JwtUser) {
    const member = this.familyService.addMember(req.family_id, req.member_id, req.role, user)
    return member
  }
  @Post('test-push')
  @ApiOperation({ summary: 'Thử gửi thông báo đến thiết bị có body.token' })
  async sendTestPush(@Body() body: { token: string }) {
    return this.firebaseService.sendNotification(
      body.token,
      'Test Notification',
      'Hello from NestJS Firebase!'
    );
  }

  /** Get all families */
  @Get()
  @ApiOperation({ summary: 'Lấy ra toàn bộ gia đình' })
  async getAllFamilies() {
    return this.familyService.getAllFamilies();
  }

  /** Get family by ID */
  @Get(':id')
  @ApiOperation({ summary: 'Lấy gia đình theo id' })
  async getFamilyById(@Param('id', ParseIntPipe) id: number) {
    return this.familyService.getFamilyById(id);
  }

  @Get('my-family')
  @ApiOperation({ summary: 'Lấy ra các nhóm gia đình có người dùng là thành viên' })
  async getMyFamily(@User() user: JwtUser) {
    return this.familyService.getMyFamily(user.id)
  }

  /** Update family */
  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật gia đình(đổi tên hoặc owner)' })
  async updateFamily(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFamilyDto,
    @User() user: JwtUser,
  ) {
    return this.familyService.updateFamily(id, dto, user.id, user.role);
  }

  /** Delete family */
  @ApiOperation({ summary: 'Xóa gia đình' })
  @Delete(':id')
  async deleteFamily(
    @Param('id', ParseIntPipe) id: number,
    @User() user: JwtUser,
  ) {
    await this.familyService.deleteFamily(id, user.id, user.role);
    return { message: `Family ${id} deleted successfully` };
  }
}
