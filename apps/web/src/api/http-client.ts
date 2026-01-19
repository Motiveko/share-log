import { TIME } from "@repo/constants";
import { Config } from "@web/config/env";
import { createHttpClient } from "@web/lib/http";

const BASE_HTTP_CLIENT_TIMEOUT = TIME.SECOND * 10;

const baseHttpClient = createHttpClient({
  baseURL: Config.API_URL,
  timeout: BASE_HTTP_CLIENT_TIMEOUT,
  withCredentials: true,
});

const minioHttpClient = createHttpClient({
  timeout: BASE_HTTP_CLIENT_TIMEOUT,
  withCredentials: true,
});

export { baseHttpClient, minioHttpClient };
