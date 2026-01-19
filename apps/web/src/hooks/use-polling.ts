import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface UsePollingOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
  intervalMs: number;
}

const usePollingState = () => {
  // isPolling과 intervalId의 정합성 관리를위해 만든 훅
  const isPollingRef = useRef(false);
  const intervalIdRef = useRef<number | null>(null);

  const setPollingStart = useCallback((_intervalId: number) => {
    isPollingRef.current = true;
    intervalIdRef.current = _intervalId;
  }, []);

  const setPollingStop = useCallback(() => {
    isPollingRef.current = false;
    if (intervalIdRef.current) {
      window.clearInterval(intervalIdRef.current);
    }
  }, []);

  return { isPollingRef, intervalIdRef, setPollingStart, setPollingStop };
};

export function usePolling<T>(
  fn: () => Promise<T>,
  options: UsePollingOptions<T>
) {
  const { enabled = true, intervalMs, onSuccess, onError } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isPollingRef, intervalIdRef, setPollingStart, setPollingStop } =
    usePollingState();

  const startPolling = useCallback(() => {
    if (isPollingRef.current) return;
    const fetchFn = async () => {
      try {
        setIsLoading(true);
        const result = await fn();

        if (onSuccess) {
          onSuccess(result);
        }
        setData(result);
        onSuccess?.(result);
      } catch (e) {
        if (onError) {
          onError(e as Error);
        }
        setError(e as Error);
      } finally {
        setIsLoading(false);
      }
    };

    setPollingStart(window.setInterval(fetchFn, intervalMs));
  }, [isPollingRef, setPollingStart, intervalMs, fn, onSuccess, onError]);

  const stopPolling = useCallback(() => {
    if (intervalIdRef.current) {
      window.clearInterval(intervalIdRef.current);
      setPollingStop();
    }
  }, [intervalIdRef, setPollingStop]);

  useEffect(() => {
    if (enabled) {
      startPolling();
      return () => {
        stopPolling();
      };
    }
  }, [enabled, startPolling, stopPolling]);

  return {
    isLoading,
    isPolling: isPollingRef.current,
    startPolling,
    stopPolling,
    ...(onSuccess ? { data } : {}),
    ...(onError ? { error } : {}),
  };
}
