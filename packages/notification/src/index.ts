import type {
  NotificationManagerOption,
  INotificationService,
  NotificationServiceOption,
  SendMessagePayload,
  SendMessageResult,
} from "./types";
import { SlackNotificationService } from "./slack";

class NotificationManager {
  private retry: number;
  private services: INotificationService[];

  constructor(options: NotificationManagerOption) {
    this.retry = options.retry || 1;
    this.services = this.getServices(options.services);
  }

  async sendMessage(payload: SendMessagePayload): Promise<SendMessageResult> {
    const result: SendMessageResult = {
      success: null,
      fails: [],
    };

    for (const service of this.services) {
      let count = this.retry;
      while (count > 0) {
        try {
          await service.sendMessage(payload);
          result.success = { type: service.type };
          break;
        } catch (e) {
          count--;
          result.fails.push({
            type: service.type,
            message: (e as Error).message,
          });
          continue;
        }
      }
      if (result.success) {
        break;
      }
    }

    return result;
  }

  private getServices(serviceOptions: NotificationServiceOption[]) {
    return serviceOptions.map(({ type, options }) => {
      switch (type) {
        case "discord":
          throw new Error("discord 옵션은 구현필요");
        case "slack":
        default:
          return new SlackNotificationService(options);
      }
    });
  }
}

export default NotificationManager;
