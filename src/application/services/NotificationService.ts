import { INotificationRepository } from '../../infrastructure/repositories/INotificationRepository';
import { NotificationResponseDto } from '../dtos/notification.dto';
import { Notification } from '../../domain/entities/Notification';
import { PaginatedResult, PaginationParams } from '../../infrastructure/database/QueryBuilder';

export class NotificationService {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  public async getUserNotifications(
    userId: string,
    params?: PaginationParams
  ): Promise<PaginatedResult<NotificationResponseDto>> {
    const result = await this.notificationRepository.findByUserId(userId, params);
    return {
      data: result.data.map((n) => this.mapToResponse(n)),
      pagination: result.pagination,
    };
  }

  public async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.countUnreadByUserId(userId);
  }

  public async markAsRead(id: string): Promise<void> {
    const notif = await this.notificationRepository.findById(id);
    if (notif) {
      notif.markAsRead();
      await this.notificationRepository.update(notif);
    }
  }

  public async markAllAsRead(userId: string): Promise<number> {
    return this.notificationRepository.markAllAsReadByUserId(userId);
  }

  private mapToResponse(notif: Notification): NotificationResponseDto {
    return {
      id: notif.id,
      userId: notif.userId,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      data: notif.data,
      isRead: notif.isRead,
      readAt: notif.readAt,
      isEmailSent: notif.isEmailSent,
      emailSentAt: notif.emailSentAt,
      createdAt: notif.createdAt,
      updatedAt: notif.updatedAt,
    };
  }
}
