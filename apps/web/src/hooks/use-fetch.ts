import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface UseFetchOptions<T extends (...args: any[]) => Promise<any>> {
  /** 훅 호출 즉시 fetch를 실행할지 여부 (기본값: false) */
  immediate?: boolean;
  /** immediate가 true일 때 사용할 초기 인자 */
  initialArgs?: Parameters<T>;
  /** fetch가 활성화되어 있는지 여부 (기본값: true) */
  enabled?: boolean;
  /** 실패 시 재시도 횟수 (기본값: 0) */
  retryCount?: number;
  /** 재시도 간격 (ms) (기본값: 1000) */
  retryDelay?: number;
  /** 성공 시 콜백 */
  onSuccess?: (data: Awaited<ReturnType<T>>) => void;
  /** 에러 발생 시 콜백 */
  onError?: (error: Error) => void;
  /** 데이터가 stale 상태가 되기까지의 시간 (ms). 이 시간 내에 refetch하면 캐시된 데이터 반환 */
  staleTime?: number;
}

export interface UseFetchResult<T extends (...args: any[]) => Promise<any>> {
  /** fetch가 한 번도 호출되지 않은 초기 상태 */
  isIdle: boolean;
  /** 현재 로딩 중인지 여부 */
  isLoading: boolean;
  /** fetch 성공 여부 */
  isSuccess: boolean;
  /** fetch 실패 여부 */
  isError: boolean;
  /** 발생한 에러 */
  error: Error | null;
  /** fetch 결과 데이터 */
  data: Awaited<ReturnType<T>> | null;
  /** fetch 함수 호출 */
  fetch: (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>> | null>;
  /** 마지막 인자로 다시 fetch */
  refetch: () => Promise<Awaited<ReturnType<T>> | null>;
  /** 상태 초기화 */
  reset: () => void;
  /** 데이터가 stale 상태인지 여부 */
  isStale: boolean;
}

export function useFetch<T extends (...args: any[]) => Promise<any>>(
  fetchFn: T,
  options: UseFetchOptions<T> = {}
): UseFetchResult<T> {
  const {
    immediate = false,
    initialArgs,
    enabled = true,
    retryCount = 0,
    retryDelay = 1000,
    onSuccess,
    onError,
    staleTime = 0,
  } = options;

  const [isIdle, setIsIdle] = useState(true);
  const [data, setData] = useState<Awaited<ReturnType<T>> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);

  // 마지막으로 호출된 인자를 저장 (refetch용)
  const lastArgsRef = useRef<Parameters<T> | null>(null);
  // 현재 진행 중인 요청의 abort controller
  const abortControllerRef = useRef<AbortController | null>(null);
  // immediate 호출이 이미 실행되었는지 추적
  const hasImmediateFetched = useRef(false);

  const isStale = useMemo(() => {
    if (!lastFetchedAt || staleTime === 0) return true;
    return Date.now() - lastFetchedAt > staleTime;
  }, [lastFetchedAt, staleTime]);

  const isSuccess = useMemo(
    () => !isIdle && !isLoading && !error && data !== null,
    [isIdle, isLoading, error, data]
  );
  const isError = useMemo(
    () => !isIdle && !isLoading && error !== null,
    [isIdle, isLoading, error]
  );

  const executeWithRetry = useCallback(
    async (
      args: Parameters<T>,
      retriesLeft: number
    ): Promise<Awaited<ReturnType<T>>> => {
      try {
        const response = await fetchFn(...args);
        return response;
      } catch (err) {
        if (retriesLeft > 0) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          return executeWithRetry(args, retriesLeft - 1);
        }
        throw err;
      }
    },
    [fetchFn, retryDelay]
  );

  const fetch = useCallback(
    async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>> | null> => {
      if (!enabled) return null;

      // staleTime 내에 있으면 캐시된 데이터 반환
      if (!isStale && data !== null) {
        return data;
      }

      // 이전 요청 취소
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      lastArgsRef.current = args;
      setIsIdle(false);
      setIsLoading(true);
      setError(null);

      try {
        const response = await executeWithRetry(args, retryCount);
        setData(response);
        setLastFetchedAt(Date.now());
        onSuccess?.(response);
        return response;
      } catch (err) {
        const error = err as Error;
        // AbortError는 무시
        if (error.name === "AbortError") {
          return null;
        }
        setError(error);
        onError?.(error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [enabled, isStale, data, executeWithRetry, retryCount, onSuccess, onError]
  );

  const refetch = useCallback(async (): Promise<Awaited<
    ReturnType<T>
  > | null> => {
    if (lastArgsRef.current === null) {
      // 이전에 호출된 적이 없으면 빈 인자로 호출
      return fetch(...([] as unknown as Parameters<T>));
    }
    // staleTime 무시하고 강제 refetch
    setLastFetchedAt(null);
    return fetch(...lastArgsRef.current);
  }, [fetch]);

  const reset = useCallback(() => {
    setIsIdle(true);
    setData(null);
    setIsLoading(false);
    setError(null);
    setLastFetchedAt(null);
    lastArgsRef.current = null;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // immediate 옵션이 true면 마운트 시 자동 호출
  useEffect(() => {
    if (immediate && enabled && !hasImmediateFetched.current) {
      hasImmediateFetched.current = true;
      const args = initialArgs ?? ([] as unknown as Parameters<T>);
      fetch(...args);
    }
  }, [immediate, enabled, fetch, initialArgs]);

  // 컴포넌트 언마운트 시 진행 중인 요청 취소
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const result = useMemo(
    () => ({
      isIdle,
      isLoading,
      isSuccess,
      isError,
      error,
      data,
      fetch,
      refetch,
      reset,
      isStale,
    }),
    [
      isIdle,
      isLoading,
      isSuccess,
      isError,
      error,
      data,
      fetch,
      refetch,
      reset,
      isStale,
    ]
  );

  return result;
}
