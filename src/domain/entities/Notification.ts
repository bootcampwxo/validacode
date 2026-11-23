import { BaseEntity } from './BaseEntity';
import { NotificationType } from '../enums';
import { ValidationError } from '../exceptions';

export interface NotificationProps {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead?: boolean;
  readAt?: Date;
  isEmailSent?: boolean;
  emailSentAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Notification extends BaseEntity {
  private _userId: string;
  private _type: NotificationType;
  private _title: string;
  private _message: string;
  private _data: Record<string, unknown>;
  private _isRead: boolean;
  private _readAt?: Date;
  private _isEmailSent: boolean;
  private _emailSentAt?: Date;

  constructor(props: NotificationProps) {
    super(props.id, props.createdAt, props.updatedAt);
    if (!props.userId) {
      throw new ValidationError('ID do usuário destinatário é obrigatório');
    }
    if (!props.title || props.title.trim().length === 0) {
      throw new ValidationError('Título da notificação é obrigatório');
    }
    if (!props.message || props.message.trim().length === 0) {
      throw new ValidationError('Mensagem da notificação é obrigatória');
    }

    this._userId = props.userId;
    this._type = props.type;
    this._title = props.title.trim();
    this._message = props.message.trim();
    this._data = props.data || {};
    this._isRead = props.isRead || false;
    this._readAt = props.readAt;
    this._isEmailSent = props.isEmailSent || false;
    this._emailSentAt = props.emailSentAt;
  }

  public get userId(): string {
    return this._userId;
  }

  public get type(): NotificationType {
    return this._type;
  }

  public get title(): string {
    return this._title;
  }

  public get message(): string {
    return this._message;
  }

  public get data(): Record<string, unknown> {
    return { ...this._data };
  }

  public get isRead(): boolean {
    return this._isRead;
  }

  public get readAt(): Date | undefined {
    return this._readAt;
  }

  public get isEmailSent(): boolean {
    return this._isEmailSent;
  }

  public get emailSentAt(): Date | undefined {
    return this._emailSentAt;
  }

  public markAsRead(): void {
    this._isRead = true;
    this._readAt = new Date();
    this.touch();
  }

  public markEmailSent(): void {
    this._isEmailSent = true;
    this._emailSentAt = new Date();
    this.touch();
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      userId: this._userId,
      type: this._type,
      title: this._title,
      message: this._message,
      data: this._data,
      isRead: this._isRead,
      readAt: this._readAt,
      isEmailSent: this._isEmailSent,
      emailSentAt: this._emailSentAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
