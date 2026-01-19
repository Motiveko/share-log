import { Config } from "@api/config/env";
import logger from "@api/lib/logger";
import { createClient, RedisClientType } from "redis";
import { singleton } from "tsyringe";

// Declaration Merging: 같은 이름의 interface와 class를 선언하면 TS가 합쳐줌
// Proxy로 위임하는 메서드들을 TS가 인식할 수 있도록 함
// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unsafe-declaration-merging
export interface RedisClient
  extends Omit<RedisClientType, "connect" | "disconnect"> {}

@singleton()
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class RedisClient {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: `redis://${Config.REDIS_HOST}:${Config.REDIS_PORT}`,
      // password: Config.REDIS_PASSWORD,
    });

    // Proxy를 사용하여 this.client의 모든 메서드를 자동으로 위임
    return new Proxy(this, {
      get(target, prop, receiver) {
        // RedisClient 자체의 프로퍼티가 있으면 그것을 반환
        if (prop in target) {
          return Reflect.get(target, prop, receiver);
        }
        // 없으면 내부 client의 프로퍼티/메서드를 반환
        const clientValue = Reflect.get(target.client, prop, target.client);
        // 함수인 경우 바인딩을 유지
        if (typeof clientValue === "function") {
          return clientValue.bind(target.client);
        }
        return clientValue;
      },
    });
  }

  async connect() {
    this.attachEventListeners();
    this.attachConnectEventListeners();
    await this.client.connect();
  }

  async disconnect() {
    await this.client.disconnect();
    logger.info("Redis client disconnected successfully");
  }

  private attachEventListeners() {
    this.client.on("error", (err) => {
      logger.error({
        message: `❌ Redis Client Error to redis://${Config.REDIS_HOST}:${Config.REDIS_PORT}`,
        error: err,
      });
    });
  }

  private attachConnectEventListeners() {
    this.client.on("connect", () => {
      logger.info(
        `Redis connected to ${Config.REDIS_HOST}:${Config.REDIS_PORT}`
      );
    });
  }
}
