import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../entities/notification.entity';
import { User } from '../../entities/user.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { PaginationDto } from './dto/pagination.dto';
import type { JwtUser } from '../../common/types/user.type';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Tạo thông báo mới (chỉ admin)
   */
  async create(
    createNotificationDto: CreateNotificationDto,
    currentUser: JwtUser,
  ): Promise<Notification> {
    if (currentUser.role !== 'admin') {
      throw new ForbiddenException('Chỉ admin mới có quyền tạo thông báo');
    }

    const { user_id, title, body } = createNotificationDto;

    // Kiểm tra user có tồn tại không
    const user = await this.userRepository.findOne({ where: { id: user_id } });
    if (!user) {
      throw new NotFoundException(`Không tìm thấy user với ID ${user_id}`);
    }

    const notification = this.notificationRepository.create({
      user_id,
      title,
      body,
      is_read: false,
    });

    return await this.notificationRepository.save(notification);
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
      throw new NotFoundException(`Không tìm thấy thông báo với ID ${id}`);
    }

    // Chỉ user sở hữu hoặc admin mới xem được
    if (userRole !== 'admin' && notification.user_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem thông báo này');
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
      throw new NotFoundException(`Không tìm thấy thông báo với ID ${id}`);
    }

    // Chỉ user sở hữu hoặc admin mới cập nhật được
    if (userRole !== 'admin' && notification.user_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền cập nhật thông báo này');
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
      throw new NotFoundException(`Không tìm thấy thông báo với ID ${id}`);
    }

    // Chỉ user sở hữu hoặc admin mới xóa được
    if (userRole !== 'admin' && notification.user_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa thông báo này');
    }

    await this.notificationRepository.delete(id);
  }

  /**
   * Đánh dấu thông báo là đã đọc
   */
  async markAsRead(id: number, userId: number): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, user_id: userId },
    });

    if (!notification) {
      throw new NotFoundException(`Không tìm thấy thông báo với ID ${id}`);
    }

    notification.is_read = true;
    return await this.notificationRepository.save(notification);
  }

  /**
   * Đánh dấu tất cả thông báo là đã đọc
   */
  async markAllAsRead(userId: number): Promise<{ count: number }> {
    const result = await this.notificationRepository.update(
      { user_id: userId, is_read: false },
      { is_read: true },
    );

    return { count: result.affected || 0 };
  }

  /**
   * Lấy số lượng thông báo chưa đọc
   */
  async getUnreadCount(userId: number): Promise<{ count: number }> {
    const count = await this.notificationRepository.count({
      where: { user_id: userId, is_read: false },
    });

    return { count };
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

