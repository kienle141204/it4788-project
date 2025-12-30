import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ResponseCode, ResponseMessageVi } from 'src/common/errors/error-codes';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../entities/notification.entity';
import { User } from '../../entities/user.entity';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { PaginationDto } from './dto/pagination.dto';
import { NotificationsGateway } from './notifications.gateway';
import { FirebaseService } from '../../firebase/firebase.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway: NotificationsGateway,
    private firebaseService: FirebaseService,
  ) {}

  /**
   * Lưu thông báo mới vào database và emit qua WebSocket
   * Hàm này có thể được gọi từ bất kỳ service nào để tạo thông báo cho user
   * @param user_id - ID của user nhận thông báo
   * @param title - Tiêu đề thông báo
   * @param body - Nội dung thông báo (optional)
   * @returns Notification đã được lưu
   */
  async createNotification(
    user_id: number,
    title: string,
    body?: string,
  ): Promise<Notification> {
    const notificationData: Partial<Notification> = {
      user_id,
      title,
      is_read: false,
    };

    if (body) {
      notificationData.body = body;
    }

    const notification = this.notificationRepository.create(notificationData);
    const savedNotification = await this.notificationRepository.save(notification);

    // Emit thông báo mới qua WebSocket đến user
    try {
      this.notificationsGateway.emitNotificationToUser(user_id, savedNotification);
      // Cập nhật số lượng thông báo chưa đọc
      await this.notificationsGateway.emitUnreadCountToUser(user_id);
    } catch (error) {
      // Log lỗi nhưng không throw để không ảnh hưởng đến việc lưu thông báo
    }

    // Gửi push notification đến tất cả devices của user
    try {
      console.log(`[NotificationsService] 📤 Attempting to send push notification to user ${user_id}`);
      console.log(`[NotificationsService] 📝 Notification details:`, {
        notificationId: savedNotification.id,
        title,
        body: body || '(no body)',
        userId: user_id,
      });
      const pushData = {
        notificationId: savedNotification.id.toString(),
        type: 'notification',
      };
      const pushResult = await this.firebaseService.sendToUser(
        user_id,
        title,
        body || '',
        pushData,
      );
      console.log(
        `[NotificationsService] ✅ Push notification sent: ${pushResult.success} success, ${pushResult.failed} failed`,
      );
      if (pushResult.errors.length > 0) {
        console.warn(`[NotificationsService] ⚠️ Push notification errors:`, pushResult.errors);
      }
    } catch (error) {
      // Log lỗi nhưng không throw để không ảnh hưởng đến việc lưu thông báo
      console.error(
        `[NotificationsService] ⚠️ Error sending push notification (notification still saved to DB):`,
        error,
      );
    }

    return savedNotification;
  }

  /**
   * Lấy tất cả thông báo của user hiện tại (có phân trang)
   */
  async findAll(
    userId: number,
    paginationDto: PaginationDto,
  ): Promise<{
    data: Notification[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.notificationRepository.findAndCount({
      where: { user_id: userId },
      relations: ['user'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return { data, total, page, limit, totalPages };
  }

  /**
   * Lấy thông báo theo ID
   */
  async findOne(id: number, userId: number, userRole: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!notification) {
      throw new NotFoundException(ResponseMessageVi[ResponseCode.C00290]);
    }

    // Chỉ user sở hữu hoặc admin mới xem được
    if (userRole !== 'admin' && notification.user_id !== userId) {
      throw new ForbiddenException(ResponseMessageVi[ResponseCode.C00291]);
    }

    return notification;
  }

  /**
   * Cập nhật thông báo
   */
  async update(
    id: number,
    updateNotificationDto: UpdateNotificationDto,
    userId: number,
    userRole: string,
  ): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(ResponseMessageVi[ResponseCode.C00290]);
    }

    // Chỉ user sở hữu hoặc admin mới cập nhật được
    if (userRole !== 'admin' && notification.user_id !== userId) {
      throw new ForbiddenException(ResponseMessageVi[ResponseCode.C00291]);
    }

    Object.assign(notification, updateNotificationDto);
    return await this.notificationRepository.save(notification);
  }

  /**
   * Xóa thông báo
   */
  async remove(id: number, userId: number, userRole: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException(ResponseMessageVi[ResponseCode.C00290]);
    }

    // Chỉ user sở hữu hoặc admin mới xóa được
    if (userRole !== 'admin' && notification.user_id !== userId) {
      throw new ForbiddenException(ResponseMessageVi[ResponseCode.C00291]);
    }

    await this.notificationRepository.delete(id);
  }

  /**
   * Xóa tất cả thông báo của user
   */
  async removeAll(userId: number): Promise<{ count: number }> {
    const result = await this.notificationRepository.delete({
      user_id: userId,
    });

    // Emit cập nhật số lượng thông báo chưa đọc
    try {
      await this.notificationsGateway.emitUnreadCountToUser(userId);
    } catch (error) {
    }

    return { count: result.affected || 0 };
  }

  /**
   * Đánh dấu thông báo là đã đọc
   */
  async markAsRead(id: number, userId: number): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, user_id: userId },
    });

    if (!notification) {
      throw new NotFoundException(ResponseMessageVi[ResponseCode.C00290]);
    }

    notification.is_read = true;
    const savedNotification = await this.notificationRepository.save(notification);

    // Emit cập nhật số lượng thông báo chưa đọc
    try {
      await this.notificationsGateway.emitUnreadCountToUser(userId);
    } catch (error) {
    }

    return savedNotification;
  }

  /**
   * Đánh dấu tất cả thông báo là đã đọc
   */
  async markAllAsRead(userId: number): Promise<{ count: number }> {
    const result = await this.notificationRepository.update(
      { user_id: userId, is_read: false },
      { is_read: true },
    );

    // Emit cập nhật số lượng thông báo chưa đọc
    try {
      await this.notificationsGateway.emitUnreadCountToUser(userId);
    } catch (error) {
    }

    return { count: result.affected || 0 };
  }

  /**
   * Lấy số lượng thông báo chưa đọc
   */
  async getUnreadCount(userId: number): Promise<{ count: number }> {
    try {
      const count = await this.notificationRepository.count({
        where: { 
          user_id: userId, 
          is_read: false 
        },
      });

      return { count: count || 0 };
    } catch (error) {
      // Trả về 0 nếu có lỗi để không block UI
      return { count: 0 };
    }
  }

  /**
   * Lấy danh sách thông báo chưa đọc (có phân trang)
   */
  async getUnread(
    userId: number,
    paginationDto: PaginationDto,
  ): Promise<{
    data: Notification[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.notificationRepository.findAndCount({
      where: { user_id: userId, is_read: false },
      relations: ['user'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return { data, total, page, limit, totalPages };
  }
}

