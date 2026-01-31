import { cn } from "@web/lib/utils";
import { Spinner, type SpinnerProps } from "./spinner";

interface LoadingProps extends SpinnerProps {
  message?: string;
}

export function Loading({ message, className, ...spinnerProps }: LoadingProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <Spinner {...spinnerProps} />
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}

interface LoadingOverlayProps extends LoadingProps {
  minHeight?: string;
}

export function LoadingOverlay({
  message = "로딩 중...",
  minHeight = "60vh",
  ...props
}: LoadingOverlayProps) {
  return (
    <div className="flex items-center justify-center" style={{ minHeight }}>
      <Loading message={message} {...props} />
    </div>
  );
}
