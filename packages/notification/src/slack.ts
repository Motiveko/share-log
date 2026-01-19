import axios from "axios";
import type {
  SendMessagePayload} from "./types";
import {
  INotificationService,
  NotificationService,
  NotificationType
} from "./types";

export interface SlackNotificationServiceOptions {
  webhookUrl: string;
}
// Slack 알림 서비스 구현
export class SlackNotificationService extends NotificationService {
  private webHookUrl: string;

  constructor(options: SlackNotificationServiceOptions) {
    super("slack");
    this.webHookUrl = options.webhookUrl;
  }

  async sendMessage({ message }: SendMessagePayload): Promise<void> {
    await axios.post(this.webHookUrl, { text: message });
  }
}
