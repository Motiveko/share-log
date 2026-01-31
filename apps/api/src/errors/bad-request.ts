import type { ErrorCode } from "@repo/interfaces";
import { AppError } from "./base-error";

export class BadRequestError extends AppError {
  public readonly status = 400;

  constructor(message = "Bad Request", code?: ErrorCode) {
    super(message, code);
  }
}
