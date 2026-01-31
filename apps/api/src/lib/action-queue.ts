import { Config } from "@api/config/env";
import { RequestScopedLogger } from "@api/lib/logger";
import { TIME } from "@repo/constants";
import { Queue, type ConnectionOptions } from "bullmq";
import { singleton } from "tsyringe";

// Action Event Types
export type ActionEventType =
  | "created"
  | "updated"
  | "deleted"
  | "completed"
  | "joined"
  | "left"
  | "role_changed";

export interface ActionEvent<T = unknown> {
  type: ActionEventType;
  aggregateType: string;
  aggregateId: number | string;
  payload: T;
  userId?: number;
  timestamp: Date;
}

@singleton()
export class ActionQueuePublisher {
  // TODO : kafka 등으로 변경시 이 객체를 변경한다.
  private queue: Queue<ActionEvent>;

  constructor(private readonly requestLogger: RequestScopedLogger) {
    const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, ACTION_EVENT_QUEUE_NAME } =
      Config;
    const connection: ConnectionOptions = {
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD || undefined,
    };

    this.queue = new Queue(ACTION_EVENT_QUEUE_NAME, { connection });

    // 초기화 로그는 bootstrap logger 사용
    requestLogger.info(
      `ActionEventPublisher initialized with queue: ${ACTION_EVENT_QUEUE_NAME}`
    );
  }

  async publish<T>(event: Omit<ActionEvent<T>, "timestamp">): Promise<void> {
    const fullEvent: ActionEvent<T> = {
      ...event,
      timestamp: new Date(),
    };

    const jobName = `${event.aggregateType}.${event.type}`;

    await this.queue.add(jobName, fullEvent, {
      removeOnComplete: TIME.DAY / TIME.SECOND, // 1일, 단위가 ms가 아닌 초
      removeOnFail: (TIME.DAY * 2) / TIME.SECOND, // 2일
    });

    // 요청 처리 중 로그는 request-scoped logger 사용
    this.requestLogger.info({
      message: "ActionEvent published",
      event: {
        jobName,
        aggregateId: event.aggregateId,
        type: event.type,
        payload: event.payload,
      },
    });
  }

  async close(): Promise<void> {
    // TODO : 종료시 호출되도록 수정 및 확인필요
    await this.queue.close();
    this.requestLogger.info("ActionEventPublisher closed");
  }
}
