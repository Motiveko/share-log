// src/errors.ts

import type { ZodError } from "zod";
import type { AxiosError } from "axios";

/**
 * 기본 HTTP 에러 클래스
 */
export class HttpError extends Error {
  public readonly status?: number;
  public readonly data?: unknown; // 서버에서 반환한 에러 데이터
  public readonly originalError?: Error | AxiosError; // 원본 에러 객체

  constructor(
    message: string,
    status?: number,
    data?: unknown,
    originalError?: Error | AxiosError
  ) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.data = data;
    this.originalError = originalError;
    // 프로토타입 체인 복구 (TypeScript에서 Error 확장 시 필요)
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

/**
 * 응답 데이터 유효성 검사 에러 클래스
 */
export class ValidationError extends HttpError {
  public readonly zodError: ZodError;

  constructor(
    message: string,
    zodError: ZodError,
    originalError?: Error | AxiosError
  ) {
    super(message, undefined, undefined, originalError); // Validation 에러는 특정 HTTP 상태가 아닐 수 있음
    this.name = "ValidationError";
    this.zodError = zodError;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * 네트워크 또는 기타 Axios 관련 에러 클래스
 */
export class NetworkError extends HttpError {
  constructor(message: string, originalError?: Error | AxiosError) {
    super(message, undefined, undefined, originalError);
    this.name = "NetworkError";
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}
