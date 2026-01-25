import type {
  NotificationSettingResponse,
  UpdateNotificationSettingDto,
} from "@repo/interfaces";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { API } from "@web/api";
import { logger } from "@web/lib/logger";

type StateStatus = "idle" | "loading" | "success" | "error";

interface NotificationSettingState {
  setting: NotificationSettingResponse | null;
  status: StateStatus;
}

interface NotificationSettingActions {
  fetchSetting: (workspaceId: number) => Promise<void>;
  updateSetting: (
    workspaceId: number,
    dto: UpdateNotificationSettingDto
  ) => Promise<NotificationSettingResponse>;
  reset: () => void;
}

export type NotificationSettingStore = NotificationSettingState &
  NotificationSettingActions;

const initialState: NotificationSettingState = {
  setting: null,
  status: "idle",
};

export const useNotificationSettingStore = create<NotificationSettingStore>()(
  devtools(
    immer((set) => ({
      ...initialState,

      fetchSetting: async (workspaceId: number) => {
        try {
          set((state) => {
            state.status = "loading";
          });
          const setting = await API.notificationSetting.get(workspaceId);
          set((state) => {
            state.setting = setting;
            state.status = "success";
          });
        } catch (error) {
          logger.error(error);
          set((state) => {
            state.status = "error";
          });
        }
      },

      updateSetting: async (
        workspaceId: number,
        dto: UpdateNotificationSettingDto
      ) => {
        const setting = await API.notificationSetting.update(workspaceId, dto);
        set((state) => {
          state.setting = setting;
        });
        return setting;
      },

      reset: () => {
        set((state) => {
          Object.assign(state, initialState);
        });
      },
    })),
    { name: "notification-setting" }
  )
);
