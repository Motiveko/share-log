import type { ErrorCode } from "@repo/interfaces";
import { AppError } from "./base-error";

export class UnauthorizedError extends AppError {
  public readonly status = 401;

  constructor(message = "Unauthorized", code?: ErrorCode) {
    super(message, code);
  }
}
