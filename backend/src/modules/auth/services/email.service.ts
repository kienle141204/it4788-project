import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: false, // Tắt SSL/TLS
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
      // Thêm options để tắt SSL
      tls: {
        rejectUnauthorized: false
      },
      // Disable SSL
      ignoreTLS: false,
      requireTLS: false
    });
  }

  /**
   * Gửi email OTP xác minh đăng ký
   */
  async sendOtpEmail(email: string, otpCode: string): Promise<void> {
    const mailOptions = {
      from: this.configService.get<string>('SMTP_FROM'),
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

    await this.transporter.sendMail(mailOptions);
  }

}
