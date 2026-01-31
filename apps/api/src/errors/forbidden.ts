import type { ErrorCode } from "@repo/interfaces";
import { AppError } from "./base-error";

export class ForbiddenError extends AppError {
  public readonly status = 403;

  constructor(message = "Forbidden", code?: ErrorCode) {
    super(message, code);
  }
}
