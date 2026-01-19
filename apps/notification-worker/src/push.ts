import { singleton } from "tsyringe";
import webpush from "web-push";
import { Config } from "@/config/env";
import { PushSubscriptionRepository } from "@/repository";

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
}

@singleton()
export class PushService {
  constructor(private pushSubscriptionRepository: PushSubscriptionRepository) {
    // Configure web-push with VAPID keys
    webpush.setVapidDetails(
      `mailto:${Config.VAPID_EMAIL}`,
      Config.VAPID_PUBLIC_KEY,
      Config.VAPID_PRIVATE_KEY
    );
  }

  async sendToUser(userId: number, payload: PushPayload) {
    const subscriptions =
      await this.pushSubscriptionRepository.findByUserId(userId);

    if (subscriptions.length === 0) {
      return { sentCount: 0, failCount: 0 };
    }

    let sentCount = 0;
    const failedSubscriptionIds: number[] = [];

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            JSON.stringify(payload)
          );
          sentCount++;
        } catch (error) {
          // If subscription is invalid (410 Gone or 404), mark for removal
          if (
            error instanceof webpush.WebPushError &&
            (error.statusCode === 410 || error.statusCode === 404)
          ) {
            failedSubscriptionIds.push(sub.id);
          }
        }
      })
    );

    return { sentCount, failedSubscriptionIds };
  }
}
