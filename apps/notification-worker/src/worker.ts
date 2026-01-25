import { Worker, Job } from "bullmq";
import { NotificationType } from "@repo/entities/notification-setting";
import { singleton } from "tsyringe";
import { Config } from "@/config/env";
import logger from "@/lib/logger";
import { PushService } from "@/push";
import { SlackService } from "@/slack-service";
import { MailService, InvitationEmailPayload } from "@/mail-service";
import { NotificationResolver, NotificationRecipient } from "@/notification-resolver";
import {
  MessageBuilder,
  LogEventPayload,
  AdjustmentEventPayload,
  MemberEventPayload,
  WorkspaceEventPayload,
} from "@/message-builder";

export type ActionEventData = Record<string, any>;

export type NotificationEventType =
  | "log.created"
  | "log.deleted"
  | "adjustment.created"
  | "adjustment.completed"
  | "member.joined"
  | "member.left"
  | "member.role_changed"
  | "invitation.created";

export type ActionEventType = "created" | "updated" | "deleted" | "completed";

export interface InvitationCreatedEventPayload {
  invitationId: number;
  workspaceId: number;
  workspaceName: string;
  inviterEmail: string;
  inviterNickname: string;
  inviteeEmail: string;
}

export interface QueueEventData<T = any> {
  type: string;
  aggregateType: string;
  aggregateId: number | string;
  payload: T;
  userId: number;
  timestamp: Date;
}

/**
 * BullMQ Worker - 알림 이벤트를 처리
 */
@singleton()
export class NotificationEventWorker {
  private worker: Worker;

  constructor(
    private pushService: PushService,
    private slackService: SlackService,
    private mailService: MailService,
    private notificationResolver: NotificationResolver
  ) {}

  start(): void {
    logger.info({
      message: `Starting worker for queue: ${Config.BULLMQ_QUEUE_NAME}`,
    });

    this.worker = new Worker(
      Config.BULLMQ_QUEUE_NAME,
      async (job: Job) => {
        await this.processEvent(job);
      },
      {
        connection: {
          host: Config.REDIS_HOST,
          port: Config.REDIS_PORT,
        },
        concurrency: 5,
      }
    );

    this.setupEventListeners();
  }

  private async processEvent(job: Job<QueueEventData>): Promise<void> {
    const jobName = job.name;
    const { type, userId, payload } = job.data;

    logger.info({
      message: `Processing event: ${type}`,
      jobId: job.id,
      data: job.data,
    });

    try {
      switch (jobName) {
        // Log events
        case "log.created":
          await this.handleLogCreated(payload, userId);
          break;
        case "log.deleted":
          await this.handleLogDeleted(payload, userId);
          break;

        // Adjustment events
        case "adjustment.created":
          await this.handleAdjustmentCreated(payload, userId);
          break;
        case "adjustment.completed":
          await this.handleAdjustmentCompleted(payload, userId);
          break;

        // Member events
        case "member.joined":
          await this.handleMemberJoined(payload);
          break;
        case "member.left":
          await this.handleMemberLeft(payload, userId);
          break;
        case "member.role_changed":
          await this.handleRoleChanged(payload, userId);
          break;

        // Invitation events - email
        case "invitation.created":
          await this.handleInvitationCreated(payload);
          break;

        default:
          logger.warn(`Unknown event type: ${type}`);
      }

      logger.info({
        message: `Successfully processed event: ${type}`,
        jobId: job.id,
      });
    } catch (error) {
      logger.error({
        message: `Failed to process event: ${type}`,
        jobId: job.id,
        error,
      });
      throw error;
    }
  }

  private async handleLogCreated(
    payload: LogEventPayload,
    triggerUserId: number
  ): Promise<void> {
    await this.sendNotifications(
      payload.workspaceId,
      NotificationType.LOG_CREATED,
      payload,
      triggerUserId
    );
  }

  private async handleLogDeleted(
    payload: LogEventPayload,
    triggerUserId: number
  ): Promise<void> {
    await this.sendNotifications(
      payload.workspaceId,
      NotificationType.LOG_DELETED,
      payload,
      triggerUserId
    );
  }

  private async handleAdjustmentCreated(
    payload: AdjustmentEventPayload,
    triggerUserId: number
  ): Promise<void> {
    await this.sendNotifications(
      payload.workspaceId,
      NotificationType.ADJUSTMENT_CREATED,
      payload,
      triggerUserId
    );
  }

  private async handleAdjustmentCompleted(
    payload: AdjustmentEventPayload,
    triggerUserId: number
  ): Promise<void> {
    await this.sendNotifications(
      payload.workspaceId,
      NotificationType.ADJUSTMENT_COMPLETED,
      payload,
      triggerUserId
    );
  }

  private async handleMemberJoined(payload: MemberEventPayload): Promise<void> {
    // 새로 참여한 멤버는 아직 알림 설정이 없을 수 있으므로 제외
    await this.sendNotifications(
      payload.workspaceId,
      NotificationType.MEMBER_JOINED,
      payload,
      payload.userId
    );
  }

  private async handleMemberLeft(
    payload: MemberEventPayload,
    triggerUserId: number
  ): Promise<void> {
    await this.sendNotifications(
      payload.workspaceId,
      NotificationType.MEMBER_LEFT,
      payload,
      triggerUserId
    );
  }

  private async handleRoleChanged(
    payload: MemberEventPayload,
    triggerUserId: number
  ): Promise<void> {
    await this.sendNotifications(
      payload.workspaceId,
      NotificationType.ROLE_CHANGED,
      payload,
      triggerUserId
    );
  }

  private async handleInvitationCreated(
    payload: InvitationCreatedEventPayload
  ): Promise<void> {
    const { workspaceName, inviterNickname, inviterEmail, inviteeEmail } =
      payload;

    await this.mailService.sendInvitationEmail({
      inviteeEmail,
      workspaceName,
      inviterNickname,
      inviterEmail,
    });
  }

  /**
   * 웹 푸시 및 Slack 알림 발송
   */
  private async sendNotifications(
    workspaceId: number,
    notificationType: NotificationType,
    payload: WorkspaceEventPayload,
    excludeUserId?: number
  ): Promise<void> {
    const { webPushRecipients, slackRecipients } =
      await this.notificationResolver.getAllRecipients(
        workspaceId,
        notificationType,
        excludeUserId
      );

    const pushMessage = MessageBuilder.build(notificationType, payload);
    const slackMessage = MessageBuilder.buildSlackMessage(
      notificationType,
      payload
    );

    // 웹 푸시 발송
    await Promise.all(
      webPushRecipients.map((recipient) =>
        this.pushService.sendToUser(recipient.userId, pushMessage)
      )
    );

    // Slack 발송
    const slackTargets = slackRecipients
      .filter((r): r is NotificationRecipient & { slackWebhookUrl: string } =>
        Boolean(r.slackWebhookUrl)
      )
      .map((r) => ({
        webhookUrl: r.slackWebhookUrl,
        userId: r.userId,
      }));

    if (slackTargets.length > 0) {
      await this.slackService.sendToMany(slackTargets, slackMessage);
    }
  }

  private setupEventListeners(): void {
    this.worker.on("completed", (job) => {
      logger.info({
        message: `Job completed`,
        jobId: job.id,
        eventType: job.data.type,
      });
    });

    this.worker.on("failed", (job, err) => {
      logger.error({
        message: `Job failed`,
        jobId: job?.id,
        eventType: job?.data.type,
        error: err,
      });
    });

    this.worker.on("error", (err) => {
      logger.error({
        message: "Worker error",
        error: err,
      });
    });
  }

  async close(): Promise<void> {
    await this.worker.close();
  }
}
