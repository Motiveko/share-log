import { toast } from "react-toastify";
import Toast from "@web/features/toast/toast";

const DEFAULT_DURATION = 3000;

export interface AddToastOptions {
  title?: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
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
}: AddToastOptions) => {
  toast(
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
      closeButton: true,
    }
  );
};

export { addToast };
