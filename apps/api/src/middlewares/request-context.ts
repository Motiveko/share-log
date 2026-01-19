import type { RequestHandler } from "express";
import { container } from "tsyringe";
import { RequestContextStore } from "@api/lib/request-context";

/**
 * HTTP 요청이 들어올 때 AsyncLocalStorage에 request context를 설정하는 미들웨어
 * 이후 모든 로깅에서 request-id가 자동으로 포함됨
 */
export const requestContextMiddleware: RequestHandler = (req, res, next) => {
  const requestContextStore = container.resolve(RequestContextStore);

  requestContextStore.run(() => {
    // response header에도 request-id 포함 (디버깅용)
    res.setHeader("X-Request-Id", requestContextStore.getRequestId() || "");
    next();
  });
};
