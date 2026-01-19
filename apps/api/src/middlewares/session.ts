/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion  -- session middleware와 express 타입간 버전 호환 문제 대응 */
import type { RequestHandler } from "express";
import session from "express-session";
import { RedisStore } from "connect-redis";
import { Config } from "@api/config/env";
import { container } from "tsyringe";
import { TIME } from "@repo/constants";
import { RedisClient } from "@api/lib/redis";

const SESSION_TTL = TIME.DAY * 7;

const redisStore = new RedisStore({
  client: container.resolve(RedisClient),
  prefix: `${Config.SERVICE_NAME}-session:`,
  ttl: SESSION_TTL,
});

export const sessionMiddleware = session({
  store: redisStore,
  secret: Config.SESSION_SECRET,
  name: Config.SESSION_KEY,
  resave: false,
  rolling: true,
  saveUninitialized: false,
  cookie: {
    secure: Config.env === "production", // HTTPS에서만 쿠키 전송 (production)
    httpOnly: true, // XSS 공격 방지
    maxAge: SESSION_TTL, // 7일
  },
}) as RequestHandler;
