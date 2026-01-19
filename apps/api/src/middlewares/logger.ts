import type { RequestHandler } from "express";
import { container } from "tsyringe";
import { RequestScopedLogger } from "@api/lib/logger";
import { truncateLogBody } from "@api/lib/log-utils";
import { startTimer } from "@api/lib/timer";

export const loggerMiddleware: RequestHandler = (req, res, next) => {
  const requestLogger = container.resolve(RequestScopedLogger);
  const getExecutionTime = startTimer();
  // Store original res.send
  const originalSend = res.send;
  let responseBody: any = null;

  // Override res.send
  res.send = (body): typeof res => {
    responseBody = body;
    res.send = originalSend;
    return originalSend.call(res, body);
  };

  res.on("error", (error) => {
    // console.error(args);
    requestLogger.error({ message: "Error in response", error });
  });

  res.on("finish", () => {
    const duration = getExecutionTime();
    const { method, url, protocol, hostname } = req;
    const { statusCode } = res; // Remove body from here

    requestLogger.info({
      rq: {
        method,
        h: hostname,
        url,
        protocol,
        ptime: duration,
      },
      res: {
        code: statusCode,
        ...(responseBody && { body: truncateLogBody(responseBody) }),
      },
    });
  });

  next();
};
