import type { NotificationResponse } from "@repo/interfaces";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { API } from "@web/api";
import { logger } from "@web/lib/logger";

type StateStatus = "idle" | "loading" | "success" | "error";

interface NotificationState {
  notifications: NotificationResponse[];
  hasUnread: boolean;
  nextCursor?: string;
  hasMore: boolean;
  status: StateStatus;
  loadMoreStatus: StateStatus;
}

interface NotificationActions {
  fetchNotifications: () => Promise<void>;
  loadMore: () => Promise<void>;
  checkUnread: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  reset: () => void;
}

export type NotificationStore = NotificationState & NotificationActions;

const initialState: NotificationState = {
  notifications: [],
  hasUnread: false,
  nextCursor: undefined,
  hasMore: false,
  status: "idle",
  loadMoreStatus: "idle",
};

export const useNotificationStore = create<NotificationStore>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      fetchNotifications: async () => {
        try {
          set((state) => {
            state.status = "loading";
          });
          const result = await API.notification.list();
          set((state) => {
            state.notifications = result.notifications;
            state.nextCursor = result.nextCursor;
            state.hasMore = result.hasMore;
            state.status = "success";
          });
        } catch (error) {
          logger.error(error);
          set((state) => {
            state.status = "error";
          });
        }
      },

      loadMore: async () => {
        const { nextCursor, hasMore, loadMoreStatus } = get();
        if (!hasMore || loadMoreStatus === "loading") return;

        try {
          set((state) => {
            state.loadMoreStatus = "loading";
          });
          const result = await API.notification.list(nextCursor);
          set((state) => {
            state.notifications = [...state.notifications, ...result.notifications];
            state.nextCursor = result.nextCursor;
            state.hasMore = result.hasMore;
            state.loadMoreStatus = "success";
          });
        } catch (error) {
          logger.error(error);
          set((state) => {
            state.loadMoreStatus = "error";
          });
        }
      },

      checkUnread: async () => {
        try {
          const result = await API.notification.checkUnread();
          set((state) => {
            state.hasUnread = result.hasUnread;
          });
        } catch (error) {
          logger.error(error);
        }
      },

      markAsRead: async (id: number) => {
        try {
          await API.notification.markAsRead(id);
          set((state) => {
            const notification = state.notifications.find((n) => n.id === id);
            if (notification) {
              notification.isRead = true;
            }
            // 모든 알림이 읽음 상태인지 확인
            state.hasUnread = state.notifications.some((n) => !n.isRead);
          });
        } catch (error) {
          logger.error(error);
          throw error;
        }
      },

      markAllAsRead: async () => {
        try {
          await API.notification.markAllAsRead();
          set((state) => {
            state.notifications.forEach((n) => {
              n.isRead = true;
            });
            state.hasUnread = false;
          });
        } catch (error) {
          logger.error(error);
          throw error;
        }
      },

      reset: () => {
        set((state) => {
          Object.assign(state, initialState);
        });
      },
    })),
    { name: "notification" }
  )
);
