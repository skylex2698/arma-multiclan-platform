import { logger } from '../utils/logger';

type PasswordResetMailInput = {
  email: string;
  nickname: string;
  resetUrl: string;
  expiresAt: Date;
};

class MailService {
  private hasSmtpConfig() {
    return Boolean(
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_FROM
    );
  }

  async sendPasswordResetEmail(input: PasswordResetMailInput) {
    if (!this.hasSmtpConfig()) {
      logger.warn('SMTP not configured; password reset link generated but not sent', {
        email: input.email,
        resetUrl: input.resetUrl,
        expiresAt: input.expiresAt.toISOString(),
      });
      return { delivered: false, reason: 'SMTP_NOT_CONFIGURED' as const };
    }

    logger.warn('SMTP transport pending infrastructure; password reset email not sent', {
      email: input.email,
      smtpHost: process.env.SMTP_HOST,
      smtpPort: process.env.SMTP_PORT,
      resetUrl: input.resetUrl,
      expiresAt: input.expiresAt.toISOString(),
    });

    return { delivered: false, reason: 'SMTP_TRANSPORT_UNAVAILABLE' as const };
  }
}

export const mailService = new MailService();
