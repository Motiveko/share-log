import { singleton } from "tsyringe";
import nodemailer, { Transporter } from "nodemailer";
import { Config } from "@/config/env";
import logger from "@/lib/logger";

export interface InvitationEmailPayload {
  inviteeEmail: string;
  workspaceName: string;
  inviterNickname: string;
  inviterEmail: string;
}

/**
 * 이메일 발송 서비스
 */
@singleton()
export class MailService {
  private transporter: Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    if (!Config.SMTP_HOST || !Config.SMTP_USER || !Config.SMTP_PASSWORD) {
      logger.warn({
        message: "SMTP configuration is incomplete. Email sending is disabled.",
      });
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: Config.SMTP_HOST,
      port: Config.SMTP_PORT,
      secure: Config.SMTP_PORT === 465,
      auth: {
        user: Config.SMTP_USER,
        pass: Config.SMTP_PASSWORD,
      },
    });

    logger.info({
      message: "Mail transporter initialized",
      host: Config.SMTP_HOST,
      port: Config.SMTP_PORT,
    });
  }

  /**
   * 초대 이메일 발송
   */
  async sendInvitationEmail(payload: InvitationEmailPayload): Promise<boolean> {
    if (!this.transporter) {
      logger.warn({
        message: "Email transporter not configured. Skipping email send.",
      });
      return false;
    }

    const { inviteeEmail, workspaceName, inviterNickname, inviterEmail } =
      payload;

    const subject = `[Share-Log] ${workspaceName} 워크스페이스에 초대되었습니다`;
    const html = this.buildInvitationEmailHtml({
      workspaceName,
      inviterNickname,
      inviterEmail,
    });

    try {
      const result = await this.transporter.sendMail({
        from: Config.SMTP_FROM || `Share-Log <${Config.SMTP_USER}>`,
        to: inviteeEmail,
        subject,
        html,
      });

      logger.info({
        message: "Invitation email sent successfully",
        messageId: result.messageId,
        to: inviteeEmail,
        workspaceName,
      });

      return true;
    } catch (error) {
      logger.error({
        message: "Failed to send invitation email",
        error,
        to: inviteeEmail,
        workspaceName,
      });
      return false;
    }
  }

  private buildInvitationEmailHtml(params: {
    workspaceName: string;
    inviterNickname: string;
    inviterEmail: string;
  }): string {
    const { workspaceName, inviterNickname, inviterEmail } = params;
    const appUrl = Config.APP_BASE_URL;

    return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Share-Log 초대</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #1a1a1a; padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Share-Log</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 24px 0; color: #1a1a1a; font-size: 20px; font-weight: 600;">
                워크스페이스 초대
              </h2>

              <p style="margin: 0 0 16px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                안녕하세요,
              </p>

              <p style="margin: 0 0 24px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                <strong style="color: #1a1a1a;">${inviterNickname}</strong> (${inviterEmail})님이
                <strong style="color: #1a1a1a;">${workspaceName}</strong> 워크스페이스에
                당신을 초대했습니다.
              </p>

              <p style="margin: 0 0 32px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Share-Log에서 함께 지출을 기록하고 정산해보세요!
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: #1a1a1a; border-radius: 6px;">
                    <a href="${appUrl}"
                       target="_blank"
                       style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 500;">
                      초대 확인하기
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 32px 0 0 0; color: #888888; font-size: 14px; line-height: 1.6;">
                버튼이 작동하지 않으면 아래 링크를 복사하여 브라우저에 붙여넣으세요:<br>
                <a href="${appUrl}" style="color: #1a1a1a;">${appUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9f9f9; border-top: 1px solid #eeeeee;">
              <p style="margin: 0; color: #888888; font-size: 12px; text-align: center;">
                이 이메일은 Share-Log에서 자동으로 발송되었습니다.<br>
                초대를 요청하지 않으셨다면 이 이메일을 무시하셔도 됩니다.
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
  }
}
