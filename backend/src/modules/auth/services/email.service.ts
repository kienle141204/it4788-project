import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    // Cấu hình SendGrid API Key
    const sendGridApiKey = this.configService.get<string>('SENDGRID_API_KEY');
    const sendGridFrom = this.configService.get<string>('SENDGRID_FROM_EMAIL');

    if (!sendGridApiKey || !sendGridFrom) {
      this.logger.error('❌ SendGrid API configuration is missing!');
      this.logger.error('Please set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL environment variables');
      throw new Error('SendGrid API configuration is required. Set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL');
    }

    // Khởi tạo SendGrid
    sgMail.setApiKey(sendGridApiKey);
    this.logger.log('✅ Email service initialized with SendGrid API');
    this.logger.log(`SendGrid From Email: ${sendGridFrom}`);
  }

  /**
   * Gửi email OTP xác minh đăng ký
   */
  async sendOtpEmail(email: string, otpCode: string): Promise<void> {
    try {
      const sendGridFrom = this.configService.get<string>('SENDGRID_FROM_EMAIL');
      
      if (!sendGridFrom) {
        throw new Error('SENDGRID_FROM_EMAIL is not configured');
      }

      const htmlContent = `
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
      `;

      const msg = {
        to: email,
        from: sendGridFrom,
        subject: 'Mã OTP xác minh đăng ký tài khoản',
        html: htmlContent,
      };

      this.logger.log(`Attempting to send OTP email via SendGrid API to: ${email}`);
      const [response] = await sgMail.send(msg);
      this.logger.log(`✅ OTP email sent successfully via SendGrid to ${email}. Status: ${response.statusCode}`);
    } catch (error: any) {
      this.logger.error(`❌ Failed to send OTP email to ${email}`);
      this.logger.error(`Error message: ${error.message}`);
      
      // Log chi tiết lỗi từ SendGrid
      if (error.response) {
        this.logger.error(`SendGrid Error Response:`, JSON.stringify(error.response.body, null, 2));
      }
      
      if (error.code) {
        this.logger.error(`Error code: ${error.code}`);
      }

      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}
