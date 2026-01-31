import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@web/lib/utils";
import { Button } from "./button";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  message = "문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      <div className="mb-4 rounded-full bg-destructive/10 p-3">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <h3 className="text-lg font-medium text-foreground">오류 발생</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          다시 시도
        </Button>
      )}
    </div>
  );
}
