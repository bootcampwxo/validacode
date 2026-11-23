import { Notification } from '../../domain/entities/Notification';
import { IBaseRepository } from './IBaseRepository';
import { PaginationParams, PaginatedResult } from '../database/QueryBuilder';

export interface INotificationRepository extends IBaseRepository<Notification> {
  findByUserId(userId: string, params?: PaginationParams): Promise<PaginatedResult<Notification>>;
  findUnreadByUserId(userId: string): Promise<Notification[]>;
  countUnreadByUserId(userId: string): Promise<number>;
  markAllAsReadByUserId(userId: string): Promise<number>;
  findPendingEmailNotifications(limit?: number): Promise<Notification[]>;
}
