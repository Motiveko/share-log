import type { ErrorRequestHandler } from "express";
import { container } from "tsyringe";
import { QueryFailedError } from "typeorm";
import { ERROR_CODES, type ApiErrorResponse } from "@repo/interfaces";
import { AppError } from "@api/errors";
import { RequestScopedLogger } from "@api/lib/logger";

export const errorMiddleware: ErrorRequestHandler = (err, req, res, next) => {
  const requestLogger = container.resolve(RequestScopedLogger);

  // AppError 인스턴스인 경우 (BadRequestError, NotFoundError, etc.)
  if (err instanceof AppError) {
    const response: ApiErrorResponse = {
      error: err.message,
      code: err.code,
    };
    return res.status(err.status).json(response);
  }

  // PostgreSQL unique constraint violation (race condition 등으로 발생)
  if (err instanceof QueryFailedError) {
    const driverError = err.driverError as { code?: string };
    if (driverError?.code === "23505") {
      const response: ApiErrorResponse = {
        error: "이미 존재하는 데이터입니다.",
        code: ERROR_CODES.DUPLICATE_DATA,
      };
      return res.status(409).json(response);
    }
  }

  requestLogger.error({ message: "Internal Server Error...", error: err });
  const response: ApiErrorResponse = {
    error: "Internal Server Error",
    code: ERROR_CODES.UNKNOWN_ERROR,
  };
  res.status(500).json(response);
};
