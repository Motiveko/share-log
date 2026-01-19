interface ToastProps {
  closeToast: any;
  title?: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  action?: {
    label: string;
    onClick: () => void;
  };
}

function Toast({ closeToast, title, message, type, action }: ToastProps) {
  const handleClick = () => {
    action?.onClick();
    closeToast();
  };

  return (
    <div className="flex flex-row justify-between gap-2">
      <div className="flex flex-col gap-2">
        {title && <h3>{title}</h3>}
        <p>{message}</p>
      </div>
      {action && (
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={handleClick}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export default Toast;
