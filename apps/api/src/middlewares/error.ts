import type { ErrorRequestHandler } from "express";
import { container } from "tsyringe";
import { NotFoundError } from "@api/errors/not-found";
import { ValidationError } from "@api/errors/validation";
import { UnauthorizedError } from "@api/errors/un-authorized";
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

  requestLogger.error({ message: "Internal Server Error...", error: err });
  res.status(500).json({ error: "Internal Server Error" });
};
