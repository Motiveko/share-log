import { toast, ExternalToast } from "sonner";
import Toast from "@web/features/toast/toast";

const DEFAULT_DURATION = 4000;

export interface AddToastOptions {
  title?: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number | false;
  position?:
    | "top-left"
    | "top-right"
    | "top-center"
    | "bottom-left"
    | "bottom-right"
    | "bottom-center";
}

const addToast = ({
  title,
  message,
  type,
  action,
  duration = DEFAULT_DURATION,
  position = "top-right",
}: AddToastOptions): string | number => {
  const options: ExternalToast = {
    duration: duration === false ? Infinity : duration,
    position,
  };

  return toast.custom(
    (id) => (
      <Toast
        action={action}
        closeToast={() => toast.dismiss(id)}
        message={message}
        title={title}
        type={type}
      />
    ),
    options
  );
};

// 편의 메서드
const toastService = {
  success: (message: string, options?: Omit<AddToastOptions, "type" | "message">) =>
    addToast({ message, type: "success", ...options }),

  error: (message: string, options?: Omit<AddToastOptions, "type" | "message">) =>
    addToast({ message, type: "error", ...options }),

  warning: (message: string, options?: Omit<AddToastOptions, "type" | "message">) =>
    addToast({ message, type: "warning", ...options }),

  info: (message: string, options?: Omit<AddToastOptions, "type" | "message">) =>
    addToast({ message, type: "info", ...options }),

  dismiss: (toastId?: string | number) => toast.dismiss(toastId),

  dismissAll: () => toast.dismiss(),
};

export { addToast, toastService };
