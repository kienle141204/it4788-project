import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { PaginationDto } from './dto/pagination.dto';
import { User, JwtAuthGuard } from 'src/common';
import type { JwtUser } from '../../common/types/user.type';

@ApiTags('Notifications')
@Controller('api/notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Tạo thông báo mới (chỉ admin)
   * POST /api/notifications
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({
    summary: 'Tạo thông báo mới',
    description: 'API này cho phép admin tạo thông báo mới cho người dùng. Yêu cầu quyền admin.',
  })
  @ApiBody({
    type: CreateNotificationDto,
    examples: {
      example1: {
        summary: 'Tạo thông báo mới',
        value: {
          user_id: 1,
          title: 'Thông báo mới',
          body: 'Bạn có một thông báo mới từ hệ thống',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Tạo thông báo thành công',
    example: {
      success: true,
      message: 'Tạo thông báo thành công',
      data: {
        id: 1,
        user_id: 1,
        title: 'Thông báo mới',
        body: 'Bạn có một thông báo mới từ hệ thống',
        is_read: false,
        created_at: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền admin' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy user' })
  async create(
    @Body() createNotificationDto: CreateNotificationDto,
    @User() user: JwtUser,
  ) {
    const notification = await this.notificationsService.create(
      createNotificationDto,
      user,
    );

    return {
      success: true,
      message: 'Tạo thông báo thành công',
      data: notification,
    };
  }

  /**
   * Lấy tất cả thông báo của user hiện tại (có phân trang)
   * GET /api/notifications
   */
  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách thông báo của tôi',
    description: 'API này trả về danh sách tất cả thông báo của người dùng hiện tại với phân trang. Yêu cầu đăng nhập.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Số lượng items mỗi trang (mặc định: 10, tối đa: 100)' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách thông báo thành công',
    example: {
      success: true,
      message: 'Lấy danh sách thông báo trang 1 thành công',
      data: [
        {
          id: 1,
          user_id: 1,
          title: 'Thông báo mới',
          body: 'Bạn có một thông báo mới',
          is_read: false,
          created_at: '2024-01-01T00:00:00.000Z',
        },
      ],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 1,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPrevPage: false,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @User() user: JwtUser,
  ) {
    const result = await this.notificationsService.findAll(
      user.id,
      paginationDto,
    );

    return {
      success: true,
      message: `Lấy danh sách thông báo trang ${result.page} thành công`,
      data: result.data,
      pagination: {
        currentPage: result.page,
        totalPages: result.totalPages,
        totalItems: result.total,
        itemsPerPage: result.limit,
        hasNextPage: result.page < result.totalPages,
        hasPrevPage: result.page > 1,
      },
    };
  }

  /**
   * Lấy số lượng thông báo chưa đọc
   * GET /api/notifications/unread/count
   */
  @Get('unread/count')
  @ApiOperation({
    summary: 'Lấy số lượng thông báo chưa đọc',
    description: 'API này trả về số lượng thông báo chưa đọc của người dùng hiện tại. Yêu cầu đăng nhập.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy số lượng thông báo chưa đọc thành công',
    example: {
      success: true,
      message: 'Lấy số lượng thông báo chưa đọc thành công',
      data: {
        count: 5,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async getUnreadCount(@User() user: JwtUser) {
    const result = await this.notificationsService.getUnreadCount(user.id);

    return {
      success: true,
      message: 'Lấy số lượng thông báo chưa đọc thành công',
      data: result,
    };
  }

  /**
   * Lấy danh sách thông báo chưa đọc (có phân trang)
   * GET /api/notifications/unread
   */
  @Get('unread')
  @ApiOperation({
    summary: 'Lấy danh sách thông báo chưa đọc',
    description: 'API này trả về danh sách thông báo chưa đọc của người dùng hiện tại với phân trang. Yêu cầu đăng nhập.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Số lượng items mỗi trang (mặc định: 10, tối đa: 100)' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách thông báo chưa đọc thành công',
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async getUnread(
    @Query() paginationDto: PaginationDto,
    @User() user: JwtUser,
  ) {
    const result = await this.notificationsService.getUnread(
      user.id,
      paginationDto,
    );

    return {
      success: true,
      message: `Lấy danh sách thông báo chưa đọc trang ${result.page} thành công`,
      data: result.data,
      pagination: {
        currentPage: result.page,
        totalPages: result.totalPages,
        totalItems: result.total,
        itemsPerPage: result.limit,
        hasNextPage: result.page < result.totalPages,
        hasPrevPage: result.page > 1,
      },
    };
  }

  /**
   * Lấy thông báo theo ID
   * GET /api/notifications/:id
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Lấy thông báo theo ID',
    description: 'API này trả về thông tin chi tiết của một thông báo theo ID. Chỉ user sở hữu hoặc admin mới xem được. Yêu cầu đăng nhập.',
  })
  @ApiParam({ name: 'id', type: 'number', example: 1, description: 'ID của thông báo' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông báo thành công',
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền xem thông báo này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thông báo' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @User() user: JwtUser,
  ) {
    const notification = await this.notificationsService.findOne(
      id,
      user.id,
      user.role,
    );

    return {
      success: true,
      message: 'Lấy thông báo thành công',
      data: notification,
    };
  }

  /**
   * Cập nhật thông báo
   * PATCH /api/notifications/:id
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Cập nhật thông báo',
    description: 'API này cho phép cập nhật thông báo. Chỉ user sở hữu hoặc admin mới cập nhật được. Yêu cầu đăng nhập.',
  })
  @ApiParam({ name: 'id', type: 'number', example: 1, description: 'ID của thông báo' })
  @ApiBody({
    type: UpdateNotificationDto,
    examples: {
      example1: {
        summary: 'Cập nhật thông báo',
        value: {
          title: 'Thông báo đã cập nhật',
          body: 'Nội dung đã được cập nhật',
          is_read: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thông báo thành công',
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền cập nhật thông báo này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thông báo' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNotificationDto: UpdateNotificationDto,
    @User() user: JwtUser,
  ) {
    const notification = await this.notificationsService.update(
      id,
      updateNotificationDto,
      user.id,
      user.role,
    );

    return {
      success: true,
      message: 'Cập nhật thông báo thành công',
      data: notification,
    };
  }

  /**
   * Đánh dấu thông báo là đã đọc
   * PATCH /api/notifications/:id/read
   */
  @Patch(':id/read')
  @ApiOperation({
    summary: 'Đánh dấu thông báo là đã đọc',
    description: 'API này cho phép đánh dấu một thông báo là đã đọc. Yêu cầu đăng nhập.',
  })
  @ApiParam({ name: 'id', type: 'number', example: 1, description: 'ID của thông báo' })
  @ApiResponse({
    status: 200,
    description: 'Đánh dấu đã đọc thành công',
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thông báo' })
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @User() user: JwtUser,
  ) {
    const notification = await this.notificationsService.markAsRead(
      id,
      user.id,
    );

    return {
      success: true,
      message: 'Đánh dấu đã đọc thành công',
      data: notification,
    };
  }

  /**
   * Đánh dấu tất cả thông báo là đã đọc
   * PATCH /api/notifications/read-all
   */
  @Patch('read-all')
  @ApiOperation({
    summary: 'Đánh dấu tất cả thông báo là đã đọc',
    description: 'API này cho phép đánh dấu tất cả thông báo của người dùng hiện tại là đã đọc. Yêu cầu đăng nhập.',
  })
  @ApiResponse({
    status: 200,
    description: 'Đánh dấu tất cả đã đọc thành công',
    example: {
      success: true,
      message: 'Đánh dấu tất cả thông báo đã đọc thành công',
      data: {
        count: 5,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async markAllAsRead(@User() user: JwtUser) {
    const result = await this.notificationsService.markAllAsRead(user.id);

    return {
      success: true,
      message: 'Đánh dấu tất cả thông báo đã đọc thành công',
      data: result,
    };
  }

  /**
   * Xóa thông báo
   * DELETE /api/notifications/:id
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Xóa thông báo',
    description: 'API này cho phép xóa một thông báo. Chỉ user sở hữu hoặc admin mới xóa được. Yêu cầu đăng nhập.',
  })
  @ApiParam({ name: 'id', type: 'number', example: 1, description: 'ID của thông báo' })
  @ApiResponse({
    status: 200,
    description: 'Xóa thông báo thành công',
    example: {
      success: true,
      message: 'Xóa thông báo thành công',
    },
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền xóa thông báo này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thông báo' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @User() user: JwtUser,
  ) {
    await this.notificationsService.remove(id, user.id, user.role);

    return {
      success: true,
      message: 'Xóa thông báo thành công',
    };
  }
}

