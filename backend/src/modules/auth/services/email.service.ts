import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT') || 587;
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    // Log để debug (không log password)
    this.logger.log(`Initializing email service with host: ${smtpHost}, port: ${smtpPort}, user: ${smtpUser ? '***' : 'NOT SET'}`);

    if (!smtpHost || !smtpUser || !smtpPass) {
      this.logger.warn('⚠️ SMTP configuration is incomplete. Email sending may fail.');
      this.logger.warn(`SMTP_HOST: ${smtpHost ? 'SET' : 'NOT SET'}`);
      this.logger.warn(`SMTP_USER: ${smtpUser ? 'SET' : 'NOT SET'}`);
      this.logger.warn(`SMTP_PASS: ${smtpPass ? 'SET' : 'NOT SET'}`);
    }

    // Xác định secure dựa trên port (465 = secure, 587 = TLS)
    const isSecure = smtpPort === 465;

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: isSecure, // true cho port 465 (Gmail), false cho port 587
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false, // Cho phép self-signed certificates
        ciphers: 'SSLv3'
      },
      // Cấu hình cho Gmail và các SMTP servers khác
      ...(isSecure ? {} : {
        requireTLS: true, // Yêu cầu TLS cho port 587
        ignoreTLS: false,
      })
    });
  }

  /**
   * Gửi email OTP xác minh đăng ký
   */
  async sendOtpEmail(email: string, otpCode: string): Promise<void> {
    try {
      const smtpFrom = this.configService.get<string>('SMTP_FROM');
      
      if (!smtpFrom) {
        this.logger.error('SMTP_FROM is not configured');
        throw new Error('Email configuration error: SMTP_FROM is not set');
      }

      const mailOptions = {
        from: smtpFrom,
        to: email,
        subject: 'Mã OTP xác minh đăng ký tài khoản',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Mã OTP xác minh đăng ký</h2>
            <p>Xin chào,</p>
            <p>Cảm ơn bạn đã đăng ký tài khoản. Đây là mã OTP để xác minh email của bạn:</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #f8f9fa; border: 2px solid #007bff; border-radius: 10px; padding: 20px; display: inline-block;">
                <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otpCode}</h1>
              </div>
            </div>
            <p><strong>Mã OTP này sẽ hết hạn sau 3 phút.</strong></p>
            <p>Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
            <p><em>Lưu ý: Không chia sẻ mã OTP này với bất kỳ ai.</em></p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">Đây là email tự động, vui lòng không trả lời.</p>
          </div>
        `,
      };

      this.logger.log(`Attempting to send OTP email to: ${email}`);
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ OTP email sent successfully to ${email}. MessageId: ${info.messageId}`);
    } catch (error: any) {
      this.logger.error(`❌ Failed to send OTP email to ${email}:`, error.message);
      this.logger.error(`Error details:`, error);
      
      // Log thêm thông tin debug
      if (error.code) {
        this.logger.error(`Error code: ${error.code}`);
      }
      if (error.response) {
        this.logger.error(`SMTP response: ${error.response}`);
      }
      if (error.responseCode) {
        this.logger.error(`SMTP response code: ${error.responseCode}`);
      }

      // Throw error để caller có thể handle
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

}
