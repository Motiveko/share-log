import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@web/components/ui/alert-dialog";
import { useModalStore } from "./modal-service";
import { cn } from "@web/lib/utils";
import { buttonVariants } from "@web/components/ui/button";

export function ModalProvider() {
  const { modal, closeModal } = useModalStore();
  const { isOpen, type, options } = modal;

  const handleConfirm = () => {
    closeModal(true);
  };

  const handleCancel = () => {
    closeModal(false);
  };

  const isDestructive = type === "destructive";
  const isAlert = type === "alert";

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <AlertDialogContent className="max-w-[400px]">
        <AlertDialogHeader>
          {options.title && (
            <AlertDialogTitle>{options.title}</AlertDialogTitle>
          )}
          <AlertDialogDescription
            className={cn(!options.title && "text-foreground text-base")}
          >
            {options.message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {!isAlert && (
            <AlertDialogCancel onClick={handleCancel}>
              {options.cancelText ?? "취소"}
            </AlertDialogCancel>
          )}
          <AlertDialogAction
            onClick={handleConfirm}
            className={cn(
              isDestructive &&
                buttonVariants({ variant: "destructive" })
            )}
          >
            {options.confirmText ?? "확인"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
