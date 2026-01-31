import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@web/lib/utils";
import { Button } from "@web/components/ui/button";

interface ToastProps {
  closeToast?: () => void;
  title?: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  action?: {
    label: string;
    onClick: () => void;
  };
}

const toastConfig = {
  success: {
    icon: CheckCircle2,
    containerClass:
      "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/50",
    iconClass: "text-emerald-600 dark:text-emerald-400",
    titleClass: "text-emerald-900 dark:text-emerald-100",
  },
  error: {
    icon: XCircle,
    containerClass:
      "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50",
    iconClass: "text-red-600 dark:text-red-400",
    titleClass: "text-red-900 dark:text-red-100",
  },
  warning: {
    icon: AlertTriangle,
    containerClass:
      "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50",
    iconClass: "text-amber-600 dark:text-amber-400",
    titleClass: "text-amber-900 dark:text-amber-100",
  },
  info: {
    icon: Info,
    containerClass:
      "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50",
    iconClass: "text-blue-600 dark:text-blue-400",
    titleClass: "text-blue-900 dark:text-blue-100",
  },
};

function Toast({ closeToast, title, message, type, action }: ToastProps) {
  const config = toastConfig[type];
  const Icon = config.icon;

  const handleAction = () => {
    action?.onClick();
    closeToast?.();
  };

  return (
    <div
      className={cn(
        "relative flex w-[356px] items-start gap-3 rounded-lg border p-4 shadow-lg",
        config.containerClass
      )}
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", config.iconClass)} />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {title && (
          <p className={cn("text-sm font-semibold", config.titleClass)}>
            {title}
          </p>
        )}
        <p className="text-sm text-foreground/80">{message}</p>

        {action && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 h-7 w-fit px-2 text-xs font-medium"
            onClick={handleAction}
          >
            {action.label}
          </Button>
        )}
      </div>

      <button
        onClick={() => closeToast?.()}
        className={cn(
          "shrink-0 rounded-md p-1 opacity-60 transition-opacity hover:opacity-100",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        )}
      >
        <X className="size-4" />
        <span className="sr-only">닫기</span>
      </button>
    </div>
  );
}

export default Toast;
