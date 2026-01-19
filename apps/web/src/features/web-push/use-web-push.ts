import { useCallback, useEffect, useState } from "react";
import { webPushService } from "@web/features/web-push/push-service";
import * as pushApi from "@web/api/base/push";

type PushStatus = "loading" | "unsupported" | "ready" | "subscribed" | "error";

export function useWebPush() {
  const [status, setStatus] = useState<PushStatus>("loading");
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  const initPush = useCallback(async () => {
    const isSupported = webPushService.isSupported();
    if (!isSupported) {
      setStatus("unsupported");
      return;
    }

    try {
      await webPushService.init();
      const perm = await webPushService.getPermissionState();
      setPermission(perm);

      if (webPushService.isSubscribed()) {
        setStatus("subscribed");
      } else {
        setStatus("ready");
      }
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error ? err.message : "Failed to initialize push"
      );
    }
  }, []);

  const handleSubscribe = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await webPushService.subscribe();
      setStatus("subscribed");
      setPermission("granted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to subscribe");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleUnsubscribe = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await webPushService.unsubscribe();
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unsubscribe");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSendTest = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setTestResult(null);
    try {
      const sentCount = await pushApi.sendTest(
        "🔔 Test Push",
        "Hello from your app!"
      );
      setTestResult(
        sentCount > 0
          ? `Successfully sent to ${sentCount} device(s)!`
          : "No active subscriptions found"
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send test");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initPush();
  }, [initPush]);

  return {
    status,
    permission,
    isLoading,
    error,
    testResult,
    handleSubscribe,
    handleUnsubscribe,
    handleSendTest,
  };
}
