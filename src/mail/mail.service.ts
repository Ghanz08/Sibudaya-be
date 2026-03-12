import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly resend: Resend;
  private readonly fromEmail: string;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
    this.fromEmail = this.configService.get<string>(
      'RESEND_FROM_EMAIL',
      'onboarding@resend.dev',
    );
    this.frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3001',
    );
  }

  async sendResetPasswordEmail(
    toEmail: string,
    resetToken: string,
  ): Promise<void> {
    const resetLink = `${this.frontendUrl}/auth/reset-password?token=${resetToken}`;

    const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Password</title>
</head>
<body style="margin:0;padding:0;background-color:#f7f7f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f7f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#1a1a2e;padding:0;text-align:center;position:relative;overflow:hidden;">
              <!-- Gold accent bar -->
              <div style="height:5px;background:linear-gradient(90deg,#e8b84b,#c9991e);"></div>
              <div style="padding:28px 40px 28px;">
                <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">
                  Dinas Kebudayaan DIY
                </h1>
                <p style="margin:6px 0 0;color:#e8b84b;font-size:13px;font-weight:500;letter-spacing:1px;text-transform:uppercase;">
                  Layanan Fasilitasi Lembaga Budaya
                </p>
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 24px;">
              <h2 style="margin:0 0 16px;font-size:20px;color:#1a1a2e;">
                Permintaan Reset Password
              </h2>
              <p style="margin:0 0 16px;font-size:15px;color:#4a4a4a;line-height:1.7;">
                Kami menerima permintaan untuk mereset password akun Anda.
                Klik tombol di bawah untuk membuat password baru.
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#4a4a4a;line-height:1.7;">
                Link ini hanya berlaku selama <strong style="color:#1a1a2e;">30 menit</strong>.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  <td style="border-radius:6px;background-color:#c0392b;">
                    <a href="${resetLink}"
                       style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:15px;
                              font-weight:700;text-decoration:none;border-radius:6px;letter-spacing:0.3px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Gold divider -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="height:3px;background:linear-gradient(90deg,#e8b84b,#f7f7f5);border-radius:2px;"></td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#888888;">
                Jika tombol tidak bekerja, salin dan tempel URL berikut ke browser Anda:
              </p>
              <p style="margin:0 0 32px;font-size:12px;word-break:break-all;">
                <a href="${resetLink}" style="color:#c0392b;text-decoration:none;">${resetLink}</a>
              </p>

              <hr style="border:none;border-top:1px solid #ebebeb;margin:0 0 24px;" />

              <p style="margin:0;font-size:13px;color:#aaaaaa;line-height:1.6;">
                Jika Anda tidak meminta reset password, abaikan email ini.
                Akun Anda tetap aman dan password tidak akan berubah.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#1a1a2e;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#888888;">
                &copy; 2026 Dinas Kebudayaan Daerah Istimewa Yogyakarta.
                Semua hak dilindungi.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    const { error } = await this.resend.emails.send({
      from: `Dinas Kebudayaan DIY <${this.fromEmail}>`,
      to: [toEmail],
      subject: 'Reset Password – Sistem Fasilitasi Dinas Kebudayaan DIY',
      html,
    });

    if (error) {
      throw new InternalServerErrorException(
        `Gagal mengirim email reset password: ${error.message}`,
      );
    }
  }
}
