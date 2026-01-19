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
  REDIS_HOST: getEnvVariable("REDIS_HOST"),
  REDIS_PORT: toNumber(getEnvVariable("REDIS_PORT")),
  REDIS_PASSWORD: getEnvVariable("REDIS_PASSWORD", false),
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
  BULLMQ_QUEUE_NAME: getEnvVariable("BULLMQ_QUEUE_NAME"),
  VAPID_PUBLIC_KEY: getEnvVariable("VAPID_PUBLIC_KEY"),
  VAPID_PRIVATE_KEY: getEnvVariable("VAPID_PRIVATE_KEY"),
  VAPID_EMAIL: getEnvVariable("VAPID_EMAIL"),
  env,
  isTest: env === "test",
  isDevelopment: env === "development",
};
