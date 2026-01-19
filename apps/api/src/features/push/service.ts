import { singleton } from "tsyringe";
import { Config } from "@api/config/env";
import { PushSubscriptionRepository } from "@api/features/push/repository";
import webpush from "web-push";
import { SendTestPushResponseDto } from "@api/features/push/dto";

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
}

@singleton()
export class PushService {
  constructor(
    private readonly pushSubscriptionRepository: PushSubscriptionRepository
  ) {
    // Configure web-push with VAPID keys
    webpush.setVapidDetails(
      `mailto:${Config.VAPID_EMAIL}`,
      Config.VAPID_PUBLIC_KEY,
      Config.VAPID_PRIVATE_KEY
    );
  }

  async subscribe(
    userId: number,
    endpoint: string,
    p256dh: string,
    auth: string
  ): Promise<void> {
    // Check if subscription already exists
    const existing =
      await this.pushSubscriptionRepository.findByEndpoint(endpoint);

    if (existing) {
      // Update existing subscription
      existing.p256dh = p256dh;
      existing.auth = auth;
      await this.pushSubscriptionRepository.save(existing);
      return;
    }

    // Create new subscription
    const subscription = this.pushSubscriptionRepository.create({
      endpoint,
      p256dh,
      auth,
      userId,
    });
    await this.pushSubscriptionRepository.save(subscription);
  }

  async unsubscribe(endpoint: string): Promise<boolean> {
    const subscription =
      await this.pushSubscriptionRepository.findByEndpoint(endpoint);
    if (!subscription) {
      return false;
    }
    await this.pushSubscriptionRepository.remove(subscription);
    return true;
  }

  async sendToUser(
    userId: number,
    payload: PushPayload
  ): Promise<SendTestPushResponseDto> {
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

    // Clean up invalid subscriptions
    if (failedSubscriptionIds.length > 0) {
      await this.pushSubscriptionRepository.delete(failedSubscriptionIds);
    }

    return SendTestPushResponseDto.fromPlainObject({
      sentCount,
      failCount: subscriptions.length - sentCount,
    });
  }

  getPublicKey(): string {
    return Config.VAPID_PUBLIC_KEY;
  }
}
