import * as dotenv from "dotenv";
import { toNumber } from "lodash";

const env = process.env.PHASE || "development";

if (env === "test") {
  // 테스트 환경에서는 개발환경변수를 확장해서 사용
  dotenv.config({ path: ".env.development" });
}

dotenv.config({ path: `.env.${env}`, override: true });

function getEnvVariable(key: string, required?: true): string;
function getEnvVariable(key: string, required?: false): string | undefined;
function getEnvVariable(key: string, required = true): string | undefined {
  const value = process.env[key];
  if (required && value === undefined) {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
}

export const Config = {
  SERVICE_NAME: getEnvVariable("SERVICE_NAME"),
  PORT: getEnvVariable("PORT"),
  APPLICATION_LOG_DIR: getEnvVariable("APPLICATION_LOG_DIR", false),
  TYPEORM_CONNECTION: getEnvVariable("TYPEORM_CONNECTION"),
  TYPEORM_HOST: getEnvVariable("TYPEORM_HOST"),
  TYPEORM_USERNAME: getEnvVariable("TYPEORM_USERNAME"),
  TYPEORM_PASSWORD: getEnvVariable("TYPEORM_PASSWORD"),
  TYPEORM_DATABASE: getEnvVariable("TYPEORM_DATABASE"),
  TYPEORM_SCHEMA: getEnvVariable("TYPEORM_SCHEMA"),
  TYPEORM_PORT: getEnvVariable("TYPEORM_PORT"),
  TYPEORM_SYNCHRONIZE: getEnvVariable("TYPEORM_SYNCHRONIZE"),
  TYPEORM_LOGGING: getEnvVariable("TYPEORM_LOGGING"),
  TYPEORM_ENTITIES: getEnvVariable("TYPEORM_ENTITIES"),
  GOOGLE_CLIENT_ID: getEnvVariable("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: getEnvVariable("GOOGLE_CLIENT_SECRET"),
  GOOGLE_CALLBACK_URL: getEnvVariable("GOOGLE_CALLBACK_URL"),
  JWT_SECRET: getEnvVariable("JWT_SECRET"),
  SESSION_SECRET: getEnvVariable("SESSION_SECRET"),
  SESSION_KEY: getEnvVariable("SESSION_KEY"),
  FRONTEND_URL: getEnvVariable("FRONTEND_URL"),
  REDIS_HOST: getEnvVariable("REDIS_HOST"),
  REDIS_PORT: toNumber(getEnvVariable("REDIS_PORT")),
  REDIS_PASSWORD: getEnvVariable("REDIS_PASSWORD", false),
  MINIO_HOST: getEnvVariable("MINIO_HOST"),
  MINIO_PORT: getEnvVariable("MINIO_PORT"),
  MINIO_USE_SSL: getEnvVariable("MINIO_USE_SSL", false) === "true",
  MINIO_ACCESS_KEY: getEnvVariable("MINIO_ACCESS_KEY"),
  MINIO_SECRET_KEY: getEnvVariable("MINIO_SECRET_KEY"),
  MINIO_BUCKET_NAME: getEnvVariable("MINIO_BUCKET_NAME"),
  VAPID_PUBLIC_KEY: getEnvVariable("VAPID_PUBLIC_KEY"),
  VAPID_PRIVATE_KEY: getEnvVariable("VAPID_PRIVATE_KEY"),
  VAPID_EMAIL: getEnvVariable("VAPID_EMAIL"),
  ACTION_EVENT_QUEUE_NAME: getEnvVariable("ACTION_EVENT_QUEUE_NAME"),
  env,
  isTest: env === "test",
  isDevelopment: env === "development",
};
