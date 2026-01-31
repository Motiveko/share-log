import { create } from "zustand";

export type ModalType = "alert" | "confirm" | "destructive";

export interface ModalOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

interface ModalState {
  isOpen: boolean;
  type: ModalType;
  options: ModalOptions;
  resolve: ((value: boolean) => void) | null;
}

interface ModalStore {
  modal: ModalState;
  openModal: (type: ModalType, options: ModalOptions) => Promise<boolean>;
  closeModal: (result: boolean) => void;
}

const defaultState: ModalState = {
  isOpen: false,
  type: "alert",
  options: { message: "" },
  resolve: null,
};

export const useModalStore = create<ModalStore>((set, get) => ({
  modal: defaultState,

  openModal: (type, options) => {
    return new Promise<boolean>((resolve) => {
      set({
        modal: {
          isOpen: true,
          type,
          options,
          resolve,
        },
      });
    });
  },

  closeModal: (result) => {
    const { modal } = get();
    if (modal.resolve) {
      modal.resolve(result);
    }
    set({ modal: defaultState });
  },
}));

// 편의 함수들
const modalService = {
  /**
   * 확인 모달 (확인/취소 버튼)
   */
  confirm: (message: string, options?: Omit<ModalOptions, "message">) => {
    return useModalStore.getState().openModal("confirm", { message, ...options });
  },

  /**
   * 알림 모달 (확인 버튼만)
   */
  alert: (message: string, options?: Omit<ModalOptions, "message">) => {
    return useModalStore.getState().openModal("alert", { message, ...options });
  },

  /**
   * 위험 동작 확인 모달 (삭제 등)
   */
  destructive: (message: string, options?: Omit<ModalOptions, "message">) => {
    return useModalStore.getState().openModal("destructive", {
      message,
      confirmText: options?.confirmText ?? "삭제",
      ...options,
    });
  },
};

export { modalService };
