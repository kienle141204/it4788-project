import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
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
    try {
      if (!user || !user.id) {
        return {
          success: false,
          message: 'User không hợp lệ',
          data: { count: 0 },
        };
      }

      const result = await this.notificationsService.getUnreadCount(user.id);

      return {
        success: true,
        message: 'Lấy số lượng thông báo chưa đọc thành công',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Lỗi khi lấy số lượng thông báo chưa đọc',
        data: { count: 0 },
      };
    }
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
   * Xóa một thông báo
   * DELETE /api/notifications/:id
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Xóa một thông báo',
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

  /**
   * Xóa tất cả thông báo
   * DELETE /api/notifications
   */
  @Delete()
  @ApiOperation({
    summary: 'Xóa tất cả thông báo',
    description: 'API này cho phép xóa tất cả thông báo của người dùng hiện tại. Yêu cầu đăng nhập.',
  })
  @ApiResponse({
    status: 200,
    description: 'Xóa tất cả thông báo thành công',
    example: {
      success: true,
      message: 'Xóa tất cả thông báo thành công',
      data: {
        count: 10,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async removeAll(@User() user: JwtUser) {
    const result = await this.notificationsService.removeAll(user.id);

    return {
      success: true,
      message: 'Xóa tất cả thông báo thành công',
      data: result,
    };
  }
}

