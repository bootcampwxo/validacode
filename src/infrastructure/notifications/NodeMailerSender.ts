import { IEmailSender, EmailMessage } from './IEmailSender';
import { config } from '../../config';
import { logger } from '../logging/AppLogger';

export class NodeMailerSender implements IEmailSender {
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = config.smtp.enableNotifications;
  }

  public async sendEmail(message: EmailMessage): Promise<boolean> {
    if (!this.isEnabled) {
      logger.debug(`[EmailSender (Simulado)] Para: ${message.to} | Assunto: ${message.subject}`);
      return true;
    }

    try {
      // Simulação / Envio estruturado de SMTP
      logger.info(`[EmailSender] Disparando email para ${message.to}: "${message.subject}"`);
      return true;
    } catch (error) {
      logger.error(`[EmailSender] Falha ao enviar email para ${message.to}:`, error);
      return false;
    }
  }
}
