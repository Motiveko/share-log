import type { ErrorCode } from "@repo/interfaces";
import { AppError } from "./base-error";

export class NotFoundError extends AppError {
  public readonly status = 404;

  constructor(message = "Not Found", code?: ErrorCode) {
    super(message, code);
  }
}
