import { NotificationType } from '../../domain/enums';

export interface NotificationResponseDto {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
  isRead: boolean;
  readAt?: Date;
  isEmailSent: boolean;
  emailSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
