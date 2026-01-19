import * as pushApi from "@web/api/base/push";
import { logger } from "@web/lib/logger";

class WebPushService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  async init(): Promise<boolean> {
    if (!this.isSupported()) {
      logger.warn("Push notifications are not supported in this browser");
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register("/sw.js");
      logger.log("Service Worker registered:", this.registration);

      // Check for existing subscription
      this.subscription = await this.registration.pushManager.getSubscription();
      return true;
    } catch (error) {
      logger.error("Service Worker registration failed:", error);
      return false;
    }
  }

  isSupported(): boolean {
    return (
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    );
  }

  async getPermissionState(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      return "denied";
    }
    return Notification.permission;
  }

  isSubscribed(): boolean {
    return this.subscription !== null;
  }

  getSubscription(): PushSubscription | null {
    return this.subscription;
  }

  async subscribe(): Promise<PushSubscription | null> {
    if (!this.registration) {
      throw new Error("Service Worker not registered");
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error("Notification permission denied");
    }

    // Get VAPID public key from server
    const vapidPublicKey = await pushApi.getVapidPublicKey();
    const applicationServerKey = this.urlBase64ToUint8Array(vapidPublicKey);

    // Subscribe to push notifications
    this.subscription = await this.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    // Send subscription to server
    await pushApi.subscribe(this.subscription);

    return this.subscription;
  }

  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      return false;
    }

    const endpoint = this.subscription.endpoint;

    // Unsubscribe from push manager
    const success = await this.subscription.unsubscribe();
    if (success) {
      // Remove subscription from server
      await pushApi.unsubscribe(endpoint);
      this.subscription = null;
    }

    return success;
  }

  private urlBase64ToUint8Array(base64String: string): BufferSource {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export const webPushService = new WebPushService();
