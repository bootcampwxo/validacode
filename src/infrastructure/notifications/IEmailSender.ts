export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface IEmailSender {
  sendEmail(message: EmailMessage): Promise<boolean>;
}
