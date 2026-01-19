import { useState, useEffect, useCallback } from "react";
import { useWebPush } from "@web/features/web-push/use-web-push";
import { webPushService } from "./push-service";

type PushStatus = "loading" | "unsupported" | "ready" | "subscribed" | "error";

export function WebPushTestContainer() {
  const {
    status,
    permission,
    isLoading,
    error,
    testResult,
    handleSubscribe,
    handleUnsubscribe,
    handleSendTest,
  } = useWebPush();

  if (status === "loading") {
    return (
      <div className="w-full max-w-md p-6 bg-card border border-border rounded-xl">
        <div className="flex items-center justify-center gap-2">
          <svg
            className="w-5 h-5 animate-spin text-primary"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              fill="currentColor"
            />
          </svg>
          <span className="text-sm text-muted-foreground">
            Initializing push notifications...
          </span>
        </div>
      </div>
    );
  }

  if (status === "unsupported") {
    return (
      <div className="w-full max-w-md p-6 bg-card border border-border rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-full">
            <svg
              className="w-5 h-5 text-amber-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-foreground">Push Not Supported</h3>
            <p className="text-sm text-muted-foreground">
              Your browser doesn't support push notifications
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-6 bg-card border border-border rounded-xl space-y-4">
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-full ${
            status === "subscribed" ? "bg-green-500/10" : "bg-primary/10"
          }`}
        >
          <svg
            className={`w-5 h-5 ${
              status === "subscribed" ? "text-green-500" : "text-primary"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-foreground">
            Web Push Notifications
          </h3>
          <p className="text-sm text-muted-foreground">
            {status === "subscribed"
              ? "You are subscribed to push notifications"
              : "Subscribe to receive push notifications"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Permission:</span>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            permission === "granted"
              ? "bg-green-500/10 text-green-500"
              : permission === "denied"
                ? "bg-red-500/10 text-red-500"
                : "bg-amber-500/10 text-amber-500"
          }`}
        >
          {permission}
        </span>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
          {error}
        </div>
      )}

      {testResult && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-500">
          {testResult}
        </div>
      )}

      <div className="flex gap-2">
        {status === "subscribed" ? (
          <>
            <button
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
              onClick={handleSendTest}
            >
              {isLoading ? "Sending..." : "Send Test Push"}
            </button>
            <button
              className="px-4 py-2 bg-muted text-muted-foreground rounded-lg font-medium text-sm hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
              onClick={handleUnsubscribe}
            >
              Unsubscribe
            </button>
          </>
        ) : (
          <button
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || permission === "denied"}
            onClick={handleSubscribe}
          >
            {isLoading
              ? "Subscribing..."
              : permission === "denied"
                ? "Permission Denied"
                : "Enable Push Notifications"}
          </button>
        )}
      </div>

      {permission === "denied" && (
        <p className="text-xs text-muted-foreground text-center">
          To enable notifications, please allow them in your browser settings
        </p>
      )}
    </div>
  );
}
