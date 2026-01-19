import type { LoggerConfig } from "@repo/logger";
import Logger from "@repo/logger";
import { Config } from "@/config/env";

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

const logger = {
  info: _logger.info.bind(_logger),
  warn: _logger.warn.bind(_logger),
  error: _logger.error.bind(_logger),
  log(...args: Parameters<typeof console.log>) {
    console.log(...args);
  },
};

export default logger;
