import { Worker, Job } from "bullmq";
import {
  CreateTodoEventDtoInterface,
  DeleteTodoEventDtoInterface,
  UpdateTodoEventDtoInterface,
} from "@repo/interfaces";
import { singleton } from "tsyringe";
import { Config } from "@/config/env";
import logger from "@/lib/logger";
import { PushService } from "@/push";

export type ActionEventData = Record<string, any>;

export type NotificationEventType =
  | "todo.created"
  | "todo.updated"
  | "todo.deleted";

// TODO : api랑 같이 공유하도록 @repo/interfaces로 분리
export type ActionEventType = "created" | "updated" | "deleted";

export interface QueueEventData<T = any> {
  type: string;
  aggregateType: string;
  aggregateId: number | string;
  payload: T;
  userId: number;
  timestamp: Date;
}

const MESSAGE_TEMPLATE = {
  todoCreated: {
    title: "새 할일이 생성되었습니다",
    body: "{{title}} 할일이 생성되었습니다",
  },
  todoUpdated: {
    title: "할일이 수정되었습니다",
    body: "{{title}} 할일이 수정되었습니다",
  },
  todoDeleted: {
    title: "할일이 삭제되었습니다",
    body: "{{title}} 할일이 삭제되었습니다",
  },
};

/**
 * BullMQ Worker - 알림 이벤트를 처리
 *
 * 이 Worker는 별도 프로세스에서 실행되어야 합니다.
 * notification-worker 앱에서 사용하거나,
 * API 서버와 같은 프로세스에서 실행할 수도 있습니다.
 */
@singleton()
export class NotificationEventWorker {
  private worker: Worker;

  constructor(private pushService: PushService) {}

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
        concurrency: 5, // 동시에 처리할 작업 수
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
        case "todo.created":
          // TODO : data validation 추가
          await this.handleTodoCreated(payload);
          break;
        case "todo.updated":
          await this.handleTodoUpdated(payload);
          break;
        case "todo.deleted":
          await this.handleTodoDeleted(payload);
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
      throw error; // 재시도를 위해 에러를 다시 던짐
    }
  }

  private async handleTodoCreated(
    data: CreateTodoEventDtoInterface
  ): Promise<void> {
    const { title, userId } = data;
    await this.pushService.sendToUser(userId, {
      title: MESSAGE_TEMPLATE.todoCreated.title,
      body: MESSAGE_TEMPLATE.todoCreated.body.replace("{{title}}", title),
    });
  }

  private async handleTodoUpdated(
    data: UpdateTodoEventDtoInterface
  ): Promise<void> {
    const { title, userId } = data;
    await this.pushService.sendToUser(userId, {
      title: MESSAGE_TEMPLATE.todoUpdated.title,
      body: MESSAGE_TEMPLATE.todoUpdated.body.replace("{{title}}", title),
    });
  }

  private async handleTodoDeleted(
    data: DeleteTodoEventDtoInterface
  ): Promise<void> {
    const { title, userId } = data;
    await this.pushService.sendToUser(userId, {
      title: MESSAGE_TEMPLATE.todoDeleted.title,
      body: MESSAGE_TEMPLATE.todoDeleted.body.replace("{{title}}", title),
    });
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
