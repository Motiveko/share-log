import { toast, Id } from "react-toastify";
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
}: AddToastOptions): Id => {
  return toast(
    ({ closeToast }) => (
      <Toast
        action={action}
        closeToast={closeToast}
        message={message}
        title={title}
        type={type}
      />
    ),
    {
      autoClose: duration || false,
      position,
      hideProgressBar: true,
      closeButton: false,
      className: "!bg-transparent !shadow-none !p-0 !m-0",
    }
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

  dismiss: (toastId?: Id) => toast.dismiss(toastId),

  dismissAll: () => toast.dismiss(),
};

export { addToast, toastService };
