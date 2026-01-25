import { singleton } from "tsyringe";
import { SlackNotificationService } from "@repo/notification/slack";
import logger from "@/lib/logger";

export interface SlackMessage {
  webhookUrl: string;
  message: string;
}

/**
 * Slack 웹훅 발송 서비스
 * 사용자별 슬랙 웹훅 URL로 알림을 발송
 */
@singleton()
export class SlackService {
  /**
   * 슬랙 메시지 발송
   */
  async send(params: SlackMessage): Promise<boolean> {
    const { webhookUrl, message } = params;

    if (!webhookUrl) {
      logger.warn({ message: "Slack webhook URL is not provided" });
      return false;
    }

    try {
      const slackService = new SlackNotificationService({ webhookUrl });
      await slackService.sendMessage({ message });

      logger.info({
        message: "Slack message sent successfully",
        webhookUrl: webhookUrl.substring(0, 50) + "...",
      });

      return true;
    } catch (error) {
      logger.error({
        message: "Failed to send Slack message",
        error,
        webhookUrl: webhookUrl.substring(0, 50) + "...",
      });
      return false;
    }
  }

  /**
   * 여러 사용자에게 슬랙 메시지 발송
   */
  async sendToMany(
    recipients: Array<{ webhookUrl: string; userId: number }>,
    message: string
  ): Promise<{ sentCount: number; failedCount: number }> {
    let sentCount = 0;
    let failedCount = 0;

    await Promise.all(
      recipients.map(async (recipient) => {
        const success = await this.send({
          webhookUrl: recipient.webhookUrl,
          message,
        });

        if (success) {
          sentCount++;
        } else {
          failedCount++;
        }
      })
    );

    return { sentCount, failedCount };
  }
}
