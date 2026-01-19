import type {
  SendMessagePayload} from "@notification/types";
import {
  INotificationService,
  NotificationService,
  NotificationType
} from "@notification/types";

export interface DiscordNotificationServiceOptions {
  webhookUrl: string;
}
// Slack 알림 서비스 구현
export class DiscordNotificationService extends NotificationService {
  private webHookUrl: string;

  constructor(options: DiscordNotificationServiceOptions) {
    super("discord");
    this.webHookUrl = options.webhookUrl;
  }

  async sendMessage(message: SendMessagePayload): Promise<void> {
    // TODO : 구현할것
  }
}
