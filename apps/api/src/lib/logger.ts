import type { LoggerConfig } from "@repo/logger";
import Logger from "@repo/logger";
import { Config } from "@api/config/env";
import { singleton } from "tsyringe";
import { RequestContextStore } from "@api/lib/request-context";
import { merge } from "lodash";

type LoggerInfo = string | Record<string, unknown> | Error;

const transports: LoggerConfig["transports"] = [{ type: "console" }];
if (Config.APPLICATION_LOG_DIR) {
  // 저장할 경로가 있는경우만
  transports.push({
    type: "file-rotate",
    options: {
      filename: `${Config.APPLICATION_LOG_DIR}/${Config.SERVICE_NAME}/application-%DATE%.log`,
      datePattern: "YYYY-MM-DD",
      level: "info",
      zippedArchive: true,
      maxFiles: "3d",
    },
  });
}

const _logger = new Logger({ transports });

/**
 * Bootstrap/초기화용 logger
 * HTTP 요청 컨텍스트 외부에서 사용 (앱 시작, Redis 연결 등)
 */
const logger = {
  info: _logger.info.bind(_logger),
  warn: _logger.warn.bind(_logger),
  error: _logger.error.bind(_logger),
  log(...args: Parameters<typeof console.log>) {
    console.log(...args);
  },
};

export default logger;

/**
 * HTTP 요청 처리 중 사용하는 Request-scoped Logger
 * AsyncLocalStorage를 통해 request-id를 자동으로 포함
 */
@singleton()
export class RequestScopedLogger {
  constructor(private readonly requestContextStore: RequestContextStore) {}

  private enrichLog(log: LoggerInfo): LoggerInfo {
    const context = this.requestContextStore.getContext();
    if (!context) {
      return log;
    }

    const { requestId, email, userId } = context;
    console.log(context);
    const rq: Record<string, string> = {};
    if (email) {
      rq.email = email;
    }
    if (userId) {
      rq.userId = userId.toString();
    }

    if (typeof log === "string") {
      return { message: log, "request-id": requestId, rq };
    }

    return merge({ "request-id": requestId, rq }, log);
  }

  info(log: LoggerInfo) {
    _logger.info(this.enrichLog(log));
  }

  warn(log: LoggerInfo) {
    _logger.warn(this.enrichLog(log));
  }

  error(log: LoggerInfo) {
    _logger.error(this.enrichLog(log));
  }

  log(...args: Parameters<typeof console.log>) {
    console.log(...args);
  }
}
