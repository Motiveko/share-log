/* eslint-disable @typescript-eslint/no-explicit-any */
// logger.ts
import type { Logger as WinstonLogger, LoggerOptions } from "winston";
import winston from "winston";
import "winston-daily-rotate-file";
import type { TransportConfig } from "./transports";
import { getTransportInstances } from "./transports";

// 전체 로거 설정 인터페이스
export interface LoggerConfig {
  level?: string;
  transports?: TransportConfig[];
}

// 커스텀 포맷: message 필드가 빈 문자열이나 undefined이면 제거
const removeEmptyMessage = winston.format((info) => {
  if (info.message === "" || info.message === undefined) {
    delete info.message;
  }

  return info;
});

// Error 객체를 직렬화 가능한 형태로 변환
const serializeError = (error: Error): Record<string, any> => {
  return {
    message: error.message,
    name: error.name,
    stack: error.stack,
    ...Object.getOwnPropertyNames(error).reduce<Record<string, any>>(
      (acc, key) => {
        if (key !== "message" && key !== "name" && key !== "stack") {
          acc[key] = (error as any)[key];
        }
        return acc;
      },
      {}
    ),
  };
};

// 로그 객체 내의 Error 인스턴스를 재귀적으로 직렬화 (depth 제한으로 순환 참조 방지)
const serializeErrorsDeep = (obj: any, depth = 0): any => {
  if (depth > 5) return obj; // 깊이 제한
  if (obj instanceof Error) {
    return serializeError(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => serializeErrorsDeep(item, depth + 1));
  }
  if (obj !== null && typeof obj === "object") {
    const result: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      result[key] = serializeErrorsDeep(obj[key], depth + 1);
    }
    return result;
  }
  return obj;
};

// 커스텀 포맷: Error 객체를 직렬화 가능한 형태로 변환
// info 객체의 각 속성만 순회하고, info 객체 자체는 유지 (Symbol 속성 보존)
const errorSerializer = winston.format((info) => {
  for (const key of Object.keys(info)) {
    if (info[key] instanceof Error) {
      info[key] = serializeError(info[key]);
    } else if (info[key] !== null && typeof info[key] === "object") {
      info[key] = serializeErrorsDeep(info[key], 1);
    }
  }
  return info;
});

class Logger {
  private logger: WinstonLogger;

  constructor(config: LoggerConfig = {}) {
    const transports = getTransportInstances(config.transports);
    const loggerOptions: LoggerOptions = {
      level: config.level || "info",
      format: winston.format.combine(
        winston.format.timestamp(), // 로그 시각 추가
        errorSerializer(), // Error 객체 직렬화
        removeEmptyMessage(),
        winston.format.json() // 로그를 JSON 형태로 출력
      ),
      transports,
    };

    this.logger = winston.createLogger(loggerOptions);
  }

  // 기본 log 메서드
  log(level: string, message: string, meta?: any) {
    this.logger.log(level, message, meta);
  }

  // 레벨별 편의 메서드들
  info(log: any) {
    let _log = log;
    if (typeof log === "string") {
      _log = { message: log };
    }
    this.logger.info("", _log);
  }

  warn(log: any) {
    let _log = log;
    if (typeof log === "string") {
      _log = { message: log };
    }
    this.logger.warn("", _log);
  }

  error(log: any) {
    let _log = log;
    if (typeof log === "string") {
      _log = { message: log };
    }
    this.logger.error("", _log);
  }
}

export default Logger;
