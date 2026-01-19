import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError as AxiosLibError,
  AxiosResponseHeaders,
  RawAxiosResponseHeaders,
  CreateAxiosDefaults,
} from "axios";
import axios from "axios";
import type { z, ZodTypeAny } from "zod";
import type { SetRequired } from "type-fest";
import { HttpError, ValidationError, NetworkError } from "@web/errors/http";
import { Config } from "@web/config/env";
import { logger } from "@web/lib/logger";

type _RequestConfig = SetRequired<AxiosRequestConfig, "method">;
type _RequestConfigWithSchema<T extends ZodTypeAny> = _RequestConfig & {
  schema: T;
};
type _RequestConfigWithHeaders = _RequestConfig & {
  withHeaders: true;
};
type _RequestConfigWithSchemaAndHeaders<T extends ZodTypeAny> =
  _RequestConfigWithSchema<T> & {
    withHeaders: true;
  };

export type HttpRequestConfig = Omit<_RequestConfig, "method" | "url">;
export type HttpRequestConfigWithSchema<T extends ZodTypeAny> =
  HttpRequestConfig & {
    schema: T;
  };
export type HttpRequestConfigWithHeaders = HttpRequestConfig & {
  withHeaders: true;
};
export type HttpRequestConfigWithSchemaAndHeaders<T extends ZodTypeAny> =
  HttpRequestConfigWithSchema<T> & {
    withHeaders: true;
  };

/**
 * headers를 포함한 HTTP 응답 타입
 */
export interface HttpResponse<T> {
  data: T;
  headers: RawAxiosResponseHeaders | AxiosResponseHeaders;
}

export interface HttpClientConfig extends CreateAxiosDefaults {
  /**
   * 요청 인터셉터 에러 핸들러
   */
  onRequestError?: (error: any) => any;
  /**
   * 응답 인터셉터 에러 핸들러
   */
  onResponseError?: (error: AxiosLibError) => any;
}

type HttpMethod = (<T extends ZodTypeAny>(
  url: string,
  config: HttpRequestConfigWithSchemaAndHeaders<T>
) => Promise<HttpResponse<z.infer<T>>>) &
  (<T extends ZodTypeAny>(
    url: string,
    config: HttpRequestConfigWithSchema<T>
  ) => Promise<z.infer<T>>) &
  ((
    url: string,
    config: HttpRequestConfigWithHeaders
  ) => Promise<HttpResponse<void>>) &
  ((url: string, config?: HttpRequestConfig) => Promise<void>);

export interface HttpClient {
  get: HttpMethod;
  post: HttpMethod;
  put: HttpMethod;
  delete: HttpMethod;
  patch: HttpMethod;

  /**
   * 응답 에러 인터셉터를 동적으로 추가합니다.
   * @param onRejected 에러 발생 시 실행될 콜백 함수
   * @returns 추가된 인터셉터의 ID
   */
  addErrorResponseInterceptor: (onRejected: (error: any) => any) => number;

  /**
   * ID를 사용하여 응답 에러 인터셉터를 제거합니다.
   * @param interceptorId 제거할 인터셉터의 ID
   */
  removeErrorResponseInterceptor: (interceptorId: number) => void;

  /**
   * 내부 Axios 인스턴스에 직접 접근 (고급 사용 케이스용)
   */
  readonly axiosInstance: AxiosInstance;
}

/**
 * HTTP 요청 함수 생성 (Zod 스키마로 응답 유효성 검사)
 */
function createRequest(axiosInstance: AxiosInstance) {
  // withHeaders + schema
  async function request<T extends ZodTypeAny>(
    config: _RequestConfigWithSchemaAndHeaders<T>
  ): Promise<HttpResponse<z.infer<T>>>;
  // schema only
  async function request<T extends ZodTypeAny>(
    config: _RequestConfigWithSchema<T>
  ): Promise<z.infer<T>>;
  // withHeaders only
  async function request(
    config: _RequestConfigWithHeaders
  ): Promise<HttpResponse<void>>;
  // no schema, no withHeaders
  async function request(config: _RequestConfig): Promise<void>;

  // implementation
  async function request<T extends ZodTypeAny>(
    config:
      | _RequestConfigWithSchemaAndHeaders<T>
      | _RequestConfigWithSchema<T>
      | _RequestConfigWithHeaders
      | _RequestConfig
  ): Promise<
    HttpResponse<z.infer<T>> | z.infer<T> | HttpResponse<void> | void
  > {
    const withHeaders = "withHeaders" in config && config.withHeaders;

    try {
      const response: AxiosResponse = await axiosInstance(config);
      const data = response.data;
      const headers = response.headers;

      if ("schema" in config) {
        const validationResult = config.schema.safeParse(data);
        if (validationResult.success) {
          if (withHeaders) {
            return { data: validationResult.data, headers };
          }
          return validationResult.data;
        }

        logger.error(validationResult.error);

        throw new ValidationError(
          "Response validation failed",
          validationResult.error
        );
      } else {
        if (withHeaders) {
          return { data: undefined as void, headers };
        }
        // Promise<void>
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosLibError;
        const status = axiosError.response?.status;
        const responseData = axiosError.response?.data;
        const originalMessage = axiosError.message;

        if (axiosError.response) {
          // 서버가 응답했지만 상태 코드가 2xx 범위를 벗어난 경우 (4xx, 5xx)
          throw new HttpError(
            `Request failed with status code ${status}`,
            status,
            responseData,
            axiosError // 원본 Axios 에러 포함
          );
        } else if (axiosError.request) {
          // 요청은 이루어졌으나 응답을 받지 못한 경우 (네트워크 오류 등)
          throw new NetworkError(
            "No response received from server. Check network connection.",
            axiosError
          );
        } else {
          // 요청 설정 중 에러 발생 등 그 외 Axios 관련 에러
          throw new NetworkError(
            `Failed to set up request: ${originalMessage}`,
            axiosError
          );
        }
      } else {
        // Axios 에러가 아닌 다른 종류의 에러 (예: 코드 실행 오류)
        throw new HttpError(
          "An unexpected error occurred",
          undefined, // 상태 코드 없음
          undefined,
          error instanceof Error ? error : undefined // 원본 에러가 Error 인스턴스면 포함
        );
      }
    }
  }

  return request;
}

/**
 * HttpClient 인스턴스를 생성하는 팩토리 함수
 * @param config Axios 설정 및 인터셉터 설정
 * @returns HttpClient 인스턴스
 */
export function createHttpClient(config: HttpClientConfig = {}): HttpClient {
  const { onRequestError, onResponseError, ...axiosConfig } = config;

  const axiosInstance: AxiosInstance = axios.create(axiosConfig);

  // 요청 인터셉터
  axiosInstance.interceptors.request.use(
    (config) => config,
    (error) => {
      if (onRequestError) {
        return onRequestError(error);
      }
      console.error("Request Error Interceptor:", error);
      return Promise.reject(error);
    }
  );

  // 응답 인터셉터
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error: AxiosLibError) => {
      if (onResponseError) {
        return onResponseError(error);
      }
      console.error(error);
      return Promise.reject(error);
    }
  );

  const request = createRequest(axiosInstance);

  const responseInterceptorManager = axiosInstance.interceptors.response;

  const httpClient: HttpClient = {
    get: ((url: string, config?: HttpRequestConfig) => {
      return request({ ...config, url, method: "GET" } as _RequestConfig);
    }) as HttpMethod,

    post: ((url: string, config?: HttpRequestConfig) => {
      return request({ ...config, url, method: "POST" } as _RequestConfig);
    }) as HttpMethod,

    put: ((url: string, config?: HttpRequestConfig) => {
      return request({ ...config, url, method: "PUT" } as _RequestConfig);
    }) as HttpMethod,

    delete: ((url: string, config?: HttpRequestConfig) => {
      return request({ ...config, url, method: "DELETE" } as _RequestConfig);
    }) as HttpMethod,

    patch: ((url: string, config?: HttpRequestConfig) => {
      return request({ ...config, url, method: "PATCH" } as _RequestConfig);
    }) as HttpMethod,

    addErrorResponseInterceptor: (onRejected: (error: any) => any): number => {
      return responseInterceptorManager.use((response) => response, onRejected);
    },

    removeErrorResponseInterceptor: (interceptorId: number): void => {
      responseInterceptorManager.eject(interceptorId);
    },

    get axiosInstance() {
      return axiosInstance;
    },
  };

  return httpClient;
}
