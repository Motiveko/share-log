import { singleton } from "tsyringe";
import { NotificationRepository } from "@/repositories/notification-repository";
import logger from "@/lib/logger";

/**
 * 오래된 알림을 정리하는 스케줄러
 * 매일 새벽 3시에 실행하여 30일 이상 된 알림을 삭제
 */
@singleton()
export class CleanupScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24시간
  private readonly RETENTION_DAYS = 30;

  constructor(private readonly notificationRepository: NotificationRepository) {}

  /**
   * 스케줄러 시작
   */
  start(): void {
    logger.info({ message: "Starting cleanup scheduler" });

    // 시작 시 즉시 한 번 실행
    this.runCleanup();

    // 24시간마다 실행
    this.intervalId = setInterval(() => {
      this.runCleanup();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * 스케줄러 중지
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info({ message: "Cleanup scheduler stopped" });
    }
  }

  /**
   * 정리 작업 실행
   */
  private async runCleanup(): Promise<void> {
    try {
      const deletedCount =
        await this.notificationRepository.deleteOldNotifications(
          this.RETENTION_DAYS
        );
      logger.info({
        message: `Cleanup completed: deleted ${deletedCount} old notifications`,
        deletedCount,
        retentionDays: this.RETENTION_DAYS,
      });
    } catch (error) {
      logger.error({
        message: "Failed to run cleanup",
        error,
      });
    }
  }
}
