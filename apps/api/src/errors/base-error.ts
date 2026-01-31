import type { ErrorCode } from "@repo/interfaces";

/**
 * 애플리케이션 에러 기본 클래스
 * 모든 커스텀 에러는 이 클래스를 상속
 */
export abstract class AppError extends Error {
  public abstract readonly status: number;
  public readonly code?: ErrorCode;

  constructor(message: string, code?: ErrorCode) {
    super(message);
    this.code = code;
    this.name = this.constructor.name;
  }
}
