import Logger from "@repo/logger";
import type { SlackNotificationServiceOptions } from "./slack";

interface SlackOptions {
  type: "slack";
  options: SlackNotificationServiceOptions;
}

// TODO : discord 옵션 구현할것
interface DiscordOptions {
  type: "discord";
  options: never;
}

export interface SendMessagePayload {
  message: string;
}

export interface INotificationService {
  type: NotificationType;
  sendMessage: (payload: SendMessagePayload) => Promise<void>;
}

export abstract class NotificationService implements INotificationService {
  constructor(private _type: NotificationType) {}
  abstract sendMessage(payload: SendMessagePayload): Promise<void>;
  get type() {
    return this._type;
  }
}

export type NotificationServiceOption = SlackOptions | DiscordOptions;

export type NotificationType = NotificationServiceOption["type"];

export interface NotificationManagerOption {
  retry?: number;
  services: NotificationServiceOption[];
}

interface SendMessageFailResult {
  type: NotificationType;
  message: string;
}

export interface SendMessageResult {
  success: { type: NotificationType } | null;
  fails: SendMessageFailResult[];
}
