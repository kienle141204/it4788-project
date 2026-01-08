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

    // Cấu hình transporter với TLS phù hợp cho production
    // Tăng timeout và cải thiện cấu hình cho Render
    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: isSecure, // true cho port 465 (SSL), false cho port 587 (TLS)
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        // Không reject unauthorized certificates trong production để tránh lỗi
        rejectUnauthorized: false,
        // Không dùng SSLv3 (đã deprecated), để Node.js tự chọn cipher phù hợp
        minVersion: 'TLSv1.2',
      },
      // Cấu hình cho Gmail và các SMTP servers khác
      ...(isSecure ? {} : {
        requireTLS: true, // Yêu cầu TLS cho port 587
        ignoreTLS: false,
      }),
      // Tăng timeout cho Render (có thể mất thời gian kết nối)
      connectionTimeout: 30000, // 30 seconds (tăng từ 10s)
      greetingTimeout: 30000, // 30 seconds
      socketTimeout: 30000, // 30 seconds
      // Thêm pool connection để tái sử dụng kết nối
      pool: true,
      maxConnections: 1,
      maxMessages: 3,
      // Rate limiting để tránh bị Gmail chặn
      rateDelta: 1000, // 1 second between messages
      rateLimit: 5, // Max 5 messages per rateDelta
    });

    // Verify connection khi khởi tạo (chỉ trong development để debug)
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    if (nodeEnv !== 'production') {
      this.transporter.verify().then(() => {
        this.logger.log('✅ SMTP connection verified successfully');
      }).catch((error) => {
        this.logger.error('❌ SMTP connection verification failed:', error.message);
      });
    }
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
      
      // Thử gửi email với retry mechanism
      let lastError: any;
      const maxRetries = 3;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 1) {
            this.logger.log(`Retry attempt ${attempt}/${maxRetries} for ${email}`);
            // Đợi trước khi retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, attempt * 2000));
          }
          
          const info = await this.transporter.sendMail(mailOptions);
          this.logger.log(`✅ OTP email sent successfully to ${email}. MessageId: ${info.messageId}`);
          return; // Thành công, thoát khỏi function
        } catch (error: any) {
          lastError = error;
          this.logger.warn(`Attempt ${attempt}/${maxRetries} failed: ${error.message}`);
          
          // Nếu là connection timeout và chưa hết retry, thử lại
          if (error.code === 'ETIMEDOUT' && attempt < maxRetries) {
            continue;
          }
          // Nếu là lỗi khác không phải timeout, throw ngay
          throw error;
        }
      }
      
      // Nếu tất cả retry đều fail, throw error cuối cùng
      throw lastError;
    } catch (error: any) {
      this.logger.error(`❌ Failed to send OTP email to ${email}`);
      this.logger.error(`Error message: ${error.message}`);
      
      // Log thêm thông tin debug chi tiết
      if (error.code) {
        this.logger.error(`Error code: ${error.code}`);
      }
      if (error.response) {
        this.logger.error(`SMTP response: ${error.response}`);
      }
      if (error.responseCode) {
        this.logger.error(`SMTP response code: ${error.responseCode}`);
      }
      if (error.command) {
        this.logger.error(`Failed SMTP command: ${error.command}`);
      }
      if (error.stack) {
        this.logger.error(`Error stack: ${error.stack}`);
      }

      // Log cấu hình hiện tại (không log password)
      const smtpHost = this.configService.get<string>('SMTP_HOST');
      const smtpPort = this.configService.get<number>('SMTP_PORT') || 587;
      const smtpUser = this.configService.get<string>('SMTP_USER');
      this.logger.error(`Current SMTP config - Host: ${smtpHost}, Port: ${smtpPort}, User: ${smtpUser ? 'SET' : 'NOT SET'}`);

      // Throw error với thông tin chi tiết hơn
      const errorMessage = error.response || error.message || 'Unknown error';
      throw new Error(`Failed to send email: ${errorMessage}`);
    }
  }

}
