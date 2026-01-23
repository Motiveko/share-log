import { singleton } from "tsyringe";
import { RedisClient } from "@api/lib/redis";

const LAST_VISIT_KEY_PREFIX = "last_visit_workspace:user:";
const LAST_VISIT_TTL_SECONDS = 30 * 24 * 60 * 60; // 30일

@singleton()
export class LastVisitService {
  constructor(private readonly redisClient: RedisClient) {}

  private getKey(userId: number): string {
    return `${LAST_VISIT_KEY_PREFIX}${userId}`;
  }

  /**
   * 마지막 방문 워크스페이스 저장
   */
  async set(userId: number, workspaceId: number): Promise<void> {
    const key = this.getKey(userId);
    await this.redisClient.set(key, workspaceId.toString(), {
      EX: LAST_VISIT_TTL_SECONDS,
    });
  }

  /**
   * 마지막 방문 워크스페이스 조회
   */
  async get(userId: number): Promise<number | null> {
    const key = this.getKey(userId);
    const value = await this.redisClient.get(key);
    return value ? parseInt(value, 10) : null;
  }

  /**
   * 마지막 방문 워크스페이스 삭제
   */
  async delete(userId: number): Promise<void> {
    const key = this.getKey(userId);
    await this.redisClient.del(key);
  }
}
