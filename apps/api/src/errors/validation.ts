import type { ErrorCode } from "@repo/interfaces";
import { AppError } from "./base-error";

export class ValidationError extends AppError {
  public readonly status = 400;

  constructor(message: string, code?: ErrorCode) {
    super(message, code);
  }
}
