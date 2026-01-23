import type { ErrorRequestHandler } from "express";
import { container } from "tsyringe";
import { QueryFailedError } from "typeorm";
import { NotFoundError } from "@api/errors/not-found";
import { ValidationError } from "@api/errors/validation";
import { UnauthorizedError } from "@api/errors/un-authorized";
import { BadRequestError } from "@api/errors/bad-request";
import { RequestScopedLogger } from "@api/lib/logger";

export const errorMiddleware: ErrorRequestHandler = (err, req, res, next) => {
  const requestLogger = container.resolve(RequestScopedLogger);

  // console.error(err.message);
  if (err instanceof NotFoundError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }

  if (err instanceof UnauthorizedError) {
    return res.status(401).json({ error: err.message });
  }

  if (err instanceof BadRequestError) {
    return res.status(err.status).json({ error: err.message });
  }

  // PostgreSQL unique constraint violation (race condition 등으로 발생)
  if (err instanceof QueryFailedError) {
    const driverError = err.driverError as { code?: string };
    if (driverError?.code === "23505") {
      return res.status(409).json({ error: "이미 존재하는 데이터입니다." });
    }
  }

  requestLogger.error({ message: "Internal Server Error...", error: err });
  res.status(500).json({ error: "Internal Server Error" });
};
