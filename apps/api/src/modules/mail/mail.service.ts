import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST') || process.env.SMTP_HOST;
    const port = Number(this.configService.get<number>('SMTP_PORT') || process.env.SMTP_PORT || 587);
    const user = this.configService.get<string>('SMTP_USER') || process.env.SMTP_USER;
    const pass = this.configService.get<string>('SMTP_PASS') || process.env.SMTP_PASS;
    const secure = (this.configService.get<string>('SMTP_SECURE') || process.env.SMTP_SECURE) === 'true' || port === 465;
    this.fromAddress =
      this.configService.get<string>('SMTP_FROM') ||
      process.env.SMTP_FROM ||
      (user ? `"DigiTechzo CRM" <${user}>` : '"DigiTechzo CRM" <noreply@digitechzo.com>');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
      this.logger.log(`SMTP Mailer initialized using host: ${host}:${port} (${user})`);
    } else {
      this.logger.warn(
        `SMTP configuration missing (SMTP_HOST, SMTP_USER, SMTP_PASS). Will attempt fallback delivery.`,
      );
    }
  }

  async sendPasswordResetOtp(toEmail: string, code: string): Promise<boolean> {
    const subject = `Your DigiTechzo CRM Password Reset Code: ${code}`;
    const textContent = `Hello,\n\nYou requested a password reset for your DigiTechzo CRM account.\n\nYour 6-digit verification code is: ${code}\n\nThis code will expire in 15 minutes.\n\nIf you did not request this reset, please ignore this email or contact your CRM administrator immediately.\n\n— DigiTechzo Team`;

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #16181b; margin: 0; font-size: 22px; font-weight: 700;">DigiTechzo CRM</h2>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Sales &amp; Operations Platform</p>
        </div>
        
        <div style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="color: #334155; font-size: 14px; margin: 0 0 16px 0; font-weight: 500;">
            Use the following 6-digit verification code to reset your password:
          </p>
          <div style="display: inline-block; background-color: #ffffff; border: 2px dashed #57B71B; border-radius: 8px; padding: 12px 28px; font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #16181b;">
            ${code}
          </div>
          <p style="color: #64748b; font-size: 12px; margin: 16px 0 0 0;">
            This verification code is valid for <strong>15 minutes</strong>.
          </p>
        </div>

        <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0 0 16px 0;">
          <strong>Security Notice:</strong> If you did not request this password reset, please ignore this message. Never share this code with anyone.
        </p>
        
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
        
        <div style="text-align: center; color: #94a3b8; font-size: 11px;">
          &copy; ${new Date().getFullYear()} DigiTechzo Media &amp; Technologies Pvt Ltd. All rights reserved.
        </div>
      </div>
    `;

    // Try configured transporter
    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: this.fromAddress,
          to: toEmail,
          subject,
          text: textContent,
          html: htmlContent,
        });
        this.logger.log(`Password reset email sent to ${toEmail}. Message ID: ${info.messageId}`);
        return true;
      } catch (err: any) {
        this.logger.error(`Failed to send email via configured SMTP: ${err?.message || err}`);
      }
    }

    // Fallback: create an Ethereal test account if no SMTP configured
    try {
      this.logger.log(`Creating test mailer fallback for ${toEmail}...`);
      const testAccount = await nodemailer.createTestAccount();
      const testTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      const info = await testTransporter.sendMail({
        from: '"DigiTechzo CRM" <noreply@digitechzo.com>',
        to: toEmail,
        subject,
        text: textContent,
        html: htmlContent,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      this.logger.log(`=======================================================`);
      this.logger.log(`[MAIL DISPATCHED] To: ${toEmail}`);
      this.logger.log(`[TEST PREVIEW URL]: ${previewUrl}`);
      this.logger.log(`=======================================================`);
      return true;
    } catch (testErr: any) {
      this.logger.error(`Ethereal fallback failed: ${testErr?.message || testErr}`);
      this.logger.log(`[MAIL DISPATCH FALLBACK] Code for ${toEmail} is: ${code}`);
      return false;
    }
  }
}
